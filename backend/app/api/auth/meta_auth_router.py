# D:\socialadify\backend\app\api\auth\meta_auth_router.py
import httpx
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse, JSONResponse
import logging
from typing import Annotated, Optional, List, Dict, Any
from pydantic import BaseModel

from app.core.security import get_current_active_user
from app.schemas.user import UserInDB
from app.crud import user as user_service
from app.db.session import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core import config

# --- Dependencies and Setup ---
CurrentUserDependency = Annotated[UserInDB, Depends(get_current_active_user)]
DbDependency = Annotated[AsyncIOMotorDatabase, Depends(get_database)]
router = APIRouter()
logger = logging.getLogger(__name__)

# --- Meta OAuth Configuration ---
META_APP_ID = config.META_APP_ID
META_APP_SECRET = config.META_APP_SECRET
META_REDIRECT_URI = f"{config.SERVER_HOST}/auth/meta/callback"

# --- UPDATED: Added ads_management and ads_read ---
META_SCOPES = (
    "pages_show_list,pages_read_engagement,pages_manage_posts,"
    "instagram_basic,instagram_content_publish,"
    "business_management,read_insights,instagram_manage_insights,"
    "ads_management,ads_read"
)
# ---

# --- Pydantic Models ---
class LinkedMetaAccountPayload(BaseModel):
    # The frontend only needs to send the ID of the page the user picked
    page_id: str

class MetaAuthURLResponse(BaseModel):
    authorization_url: str

class MetaPageForClient(BaseModel):
    page_id: str
    page_name: str
    instagram_id: Optional[str] = None
    instagram_username: Optional[str] = None

class MetaPagesResponse(BaseModel):
    accounts: List[MetaPageForClient]


# --- Authentication Endpoints ---

@router.get("/meta/auth-url", response_model=MetaAuthURLResponse)
async def get_meta_auth_url(current_user: CurrentUserDependency):
    """Generates the Meta OAuth URL, requesting all necessary permissions."""
    state = str(current_user.id)
    authorization_url = (
        f"https://www.facebook.com/v19.0/dialog/oauth?"
        f"client_id={META_APP_ID}&"
        f"redirect_uri={META_REDIRECT_URI}&"
        f"scope={META_SCOPES}&"
        f"state={state}"
    )
    return {"authorization_url": authorization_url}


@router.get("/meta/callback")
async def meta_callback(request: Request, db: DbDependency):
    """
    BIGGEST CHANGE: Handles OAuth callback, gets the user token, then immediately
    fetches all pages AND ad accounts, saving them securely to the database.
    """
    code = request.query_params.get('code')
    state_user_id = request.query_params.get('state')
    error_url = f"{config.CLIENT_HOST}/connections?meta_auth=error"

    if not code or not state_user_id:
        return RedirectResponse(url=f"{error_url}&detail=Missing_code_or_state")
    user = await user_service.get_user_by_id(db, user_id=state_user_id)
    if not user:
        return RedirectResponse(url=f"{error_url}&detail=User_not_found")
    
    token_url = "https://graph.facebook.com/v19.0/oauth/access_token"
    
    async with httpx.AsyncClient() as client:
        try:
            # 1. Exchange code for a long-lived user token
            short_token_params = {"client_id": META_APP_ID, "redirect_uri": META_REDIRECT_URI, "client_secret": META_APP_SECRET, "code": code}
            resp = await client.get(token_url, params=short_token_params)
            resp.raise_for_status()
            long_token_params = {"grant_type":"fb_exchange_token", "client_id":META_APP_ID, "client_secret":META_APP_SECRET, "fb_exchange_token": resp.json()["access_token"]}
            resp = await client.get(token_url, params=long_token_params)
            resp.raise_for_status()
            long_lived_user_token = resp.json().get("access_token")
            if not long_lived_user_token: raise ValueError("Long-lived token missing")

            # 2. NEW: Use the user token to fetch all pages and their Page Access Tokens
            accounts_url = "https://graph.facebook.com/v19.0/me/accounts"
            params = {"access_token": long_lived_user_token, "fields": "id,name,access_token,instagram_business_account{id,username}"}
            resp = await client.get(accounts_url, params=params)
            resp.raise_for_status()
            pages_data = resp.json().get("data", [])

            pages_to_store = []
            for p in pages_data:
                insta = p.get("instagram_business_account")
                pages_to_store.append({
                    "page_id": p["id"],
                    "page_name": p.get("name"),
                    "page_access_token": p.get("access_token"), # The crucial, powerful token
                    "instagram_id": insta.get("id") if insta else None,
                    "instagram_username": insta.get("username") if insta else None,
                })

            # 3. Save this entire list of pages to the user's record in the DB
            await user_service.update_user_meta_pages(db=db, user_id=user.id, pages=pages_to_store)
            logger.info(f"Successfully fetched and stored {len(pages_to_store)} Meta pages for user {user.email}")
            
            # --- NEW 4: Fetch the user's Ad Account ID ---
            ad_account_id = None
            try:
                ad_accounts_url = "https://graph.facebook.com/v19.0/me/adaccounts"
                params = {"access_token": long_lived_user_token, "fields": "id,account_id"}
                resp = await client.get(ad_accounts_url, params=params)
                resp.raise_for_status()
                ad_accounts_data = resp.json().get("data", [])
                
                if ad_accounts_data:
                    # Find the personal ad account (it contains 'act_')
                    # This is the one we usually want for this kind of app
                    personal_account = next((acc for acc in ad_accounts_data if "act_" in acc.get("id")), None)
                    
                    if personal_account:
                        ad_account_id = personal_account.get("id")
                    else:
                        # Fallback: just grab the first one
                        ad_account_id = ad_accounts_data[0].get("id")

                if ad_account_id:
                    # --- NEW 5: Save the Ad Account ID to the user ---
                    await user_service.set_user_meta_ad_account(db=db, user_id=user.id, ad_account_id=ad_account_id)
                    logger.info(f"Successfully found and saved Meta Ad Account ID {ad_account_id} for user {user.email}")
                else:
                    logger.warning(f"User {user.email} connected, but no Ad Account was found.")

            except Exception as ad_e:
                # Log this error, but don't fail the entire auth flow
                # The user might only want to schedule posts, not run ads
                logger.error(f"Failed to fetch Meta Ad Account for user {user.email}: {ad_e}")
            # ---
            
            # --- FIX: This return is now at the end of the 'try' block ---
            return RedirectResponse(url=f"{config.CLIENT_HOST}/connections?meta_auth=success")

        except (httpx.RequestError, httpx.HTTPStatusError, ValueError) as e:
            logger.error(f"Failed during Meta auth callback for user {user.email}: {e}")
            return RedirectResponse(url=f"{error_url}&detail=Token_or_Page_Fetch_failed")


@router.get("/meta/pages", response_model=MetaPagesResponse)
async def get_meta_pages(current_user: CurrentUserDependency, db: DbDependency):
    """
    NEW LOGIC: Securely reads the list of available pages from our own database
    and sends a safe, token-free version to the frontend.
    """
    user = await user_service.get_user_by_id(db, user_id=str(current_user.id))
    if not user or not user.meta_pages:
        return {"accounts": []}

    # Filter the list to create a safe version for the client (no access tokens)
    client_safe_accounts = []
    for page in user.meta_pages:
        client_safe_accounts.append({
            "page_id": page.page_id,
            "page_name": page.page_name,
            "instagram_id": page.instagram_id,
            "instagram_username": page.instagram_username,
        })
    return {"accounts": client_safe_accounts}


@router.post("/meta/save-account", status_code=status.HTTP_200_OK)
async def save_meta_account(payload: LinkedMetaAccountPayload, current_user: CurrentUserDependency, db: DbDependency):
    """
    NEW LOGIC: The frontend sends a chosen page_id. The backend finds the corresponding
    page object in its secure storage and sets it as the 'linked' account for scheduling.
    """
    user = await user_service.get_user_by_id(db, user_id=str(current_user.id))
    if not user or not user.meta_pages:
        raise HTTPException(status_code=400, detail="No pages found for user. Please try re-connecting your Meta account.")

    # Find the chosen page from the secure list stored in the database
    matched_page = next((p for p in user.meta_pages if p.page_id == payload.page_id), None)
    if not matched_page:
        raise HTTPException(status_code=404, detail="Selected page not found. Please try re-connecting your Meta account.")

    # Save the full page details (including the token) to the 'linked_' fields
    await user_service.update_user_linked_meta_accounts(
        db=db,
        user_id=current_user.id,
        page_id=matched_page.page_id,
        page_name=matched_page.page_name,
        page_access_token=matched_page.page_access_token,
        instagram_id=matched_page.instagram_id,
        instagram_username=matched_page.instagram_username
    )
    return {"message": "Account linked successfully."}


@router.post("/meta/disconnect", status_code=status.HTTP_200_OK)
async def disconnect_meta_account(current_user: CurrentUserDependency, db: DbDependency):
    """Disconnects the user's Meta account by clearing all related fields."""
    await user_service.disconnect_meta_account(db=db, user_id=current_user.id)
    return {"message": "Meta account disconnected successfully."}