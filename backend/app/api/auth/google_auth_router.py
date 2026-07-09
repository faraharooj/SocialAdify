# D:\socialadify\backend\app\api\auth\google_auth_router.py
import httpx
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse, JSONResponse
import logging
from typing import Annotated
from datetime import datetime, timedelta

from app.core.security import get_current_active_user
from app.schemas.user import UserInDB
from app.crud import user as user_service
from app.db.session import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core import config

# --- Dependencies ---
CurrentUserDependency = Annotated[UserInDB, Depends(get_current_active_user)]
DbDependency = Annotated[AsyncIOMotorDatabase, Depends(get_database)]

# --- Router Setup ---
router = APIRouter()
logger = logging.getLogger(__name__)

# --- Google OAuth 2.0 Configuration ---
GOOGLE_CLIENT_ID = config.GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET = config.GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI = f"{config.SERVER_HOST}/auth/google/callback"
GOOGLE_ADS_SCOPE = "https://www.googleapis.com/auth/adwords"

@router.get("/google/auth-url")
async def get_google_auth_url(current_user: CurrentUserDependency):
    """
    Generates and returns the Google OAuth URL for the currently logged-in user.
    Includes the user's ID in the 'state' parameter for secure callback verification.
    """
    # The 'state' parameter is a security best practice to prevent CSRF attacks.
    # We will use it to pass the user's ID to the callback.
    state = str(current_user.id)
    
    authorization_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"response_type=code&"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={GOOGLE_REDIRECT_URI}&"
        f"scope={GOOGLE_ADS_SCOPE}&"
        f"access_type=offline&"
        f"prompt=consent&"
        f"state={state}"  # Include the user's ID in the state
    )
    return JSONResponse({"authorization_url": authorization_url})


@router.get("/google/callback")
async def google_callback(request: Request, db: DbDependency):
    """
    Handles the callback from Google. Verifies the user, exchanges the code for
    tokens, and saves them to the user's database record.
    """
    code = request.query_params.get('code')
    state_user_id = request.query_params.get('state')

    if not code or not state_user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing 'code' or 'state' in callback.")

    # Fetch the user from the database using the ID from the 'state' parameter
    user = await user_service.get_user_by_id(db, user_id=state_user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User specified in 'state' not found.")

    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(token_url, data=token_data)
            response.raise_for_status()
            token_info = response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Failed to exchange Google auth code for user {user.email}: {e.response.text}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not get token from Google.")

    # Extract token information
    access_token = token_info.get("access_token")
    refresh_token = token_info.get("refresh_token")
    expires_in = token_info.get("expires_in", 3599) # Default to nearly 1 hour
    
    if not access_token or not refresh_token:
        logger.error(f"Google response missing access_token or refresh_token for user {user.email}")
        return RedirectResponse(url=f"{config.CLIENT_HOST}/connections?google_auth=error")

    expiry_time = datetime.utcnow() + timedelta(seconds=expires_in)

    # Save the credentials to the user's record
    await user_service.update_user_google_credentials(
        db=db,
        user_id=user.id,
        access_token=access_token,
        refresh_token=refresh_token,
        expiry=expiry_time
    )
    logger.info(f"Successfully saved Google credentials for user {user.email}")

    # Redirect back to the frontend connections page with a success message
    return RedirectResponse(url=f"{config.CLIENT_HOST}/connections?google_auth=success")
