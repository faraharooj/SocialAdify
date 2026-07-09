# D:\socialadify\backend\app\api\insights\google_ads_router.py

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
import logging
from typing import Annotated

from app.core.security import get_current_active_user
from app.schemas.user import UserInDB, UserPublic
import app.services.google_ads_service as google_ads_service
from app.crud import user as user_service
from app.db.session import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
# --- MODIFIED: Import all 3 mock performance objects ---
from .mock_data import (
    MOCK_CAMPAIGN_PERFORMANCE_1, 
    MOCK_CAMPAIGN_PERFORMANCE_2,
    MOCK_CAMPAIGN_PERFORMANCE_3
)

# --- Dependencies ---
CurrentUserDependency = Annotated[UserInDB, Depends(get_current_active_user)]
DbDependency = Annotated[AsyncIOMotorDatabase, Depends(get_database)]

# --- Router Setup ---
router = APIRouter()
logger = logging.getLogger(__name__)

# --- Pydantic Model for the request body ---
class AdAccountSelection(BaseModel):
    ad_account_id: str


@router.get("/google/ad-accounts")
async def get_google_ad_accounts(current_user: CurrentUserDependency):
    """
    Fetches a list of all Google Ads accounts accessible by the authenticated user.
    """
    # ... (this function's code is correct and unchanged)
    logger.info(f"Fetching Google Ads accounts for user: {current_user.email}")
    if not current_user.google_refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account not connected or refresh token is missing."
        )
    try:
        google_client = google_ads_service.get_google_ads_client(
            refresh_token=current_user.google_refresh_token
        )
        accounts = google_ads_service.list_accessible_customers(client=google_client)
        return {"accounts": accounts}
    except Exception as e:
        logger.error(f"An error occurred while fetching Google Ads accounts for {current_user.email}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve Google Ads accounts."
        )


@router.post("/google/set-ad-account", response_model=UserPublic)
async def set_google_ad_account(
    selection: AdAccountSelection,
    current_user: CurrentUserDependency,
    db: DbDependency
):
    """
    Saves the user's selected Google Ad Account ID to their profile.
    """
    # ... (this function's code is correct and unchanged)
    logger.info(f"User {current_user.email} selected Google Ad Account ID: {selection.ad_account_id}")
    updated_user = await user_service.set_user_google_ad_account(
        db=db,
        user_id=current_user.id,
        ad_account_id=selection.ad_account_id
    )
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user profile with the selected ad account."
        )
    logger.info(f"Successfully set ad account for user {current_user.email}")
    return UserPublic.from_user_in_db(updated_user)


@router.get("/google/campaigns")
async def get_google_campaigns(current_user: CurrentUserDependency):
    """
    Fetches Google Ads campaigns for the user's selected ad account.
    """
    # ... (this function's code is correct and unchanged)
    logger.info(f"Fetching Google Ads campaigns for user: {current_user.email}")
    if not current_user.google_refresh_token or not current_user.google_ad_account_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account is not fully configured. Please select an ad account."
        )
    try:
        google_client = google_ads_service.get_google_ads_client(
            refresh_token=current_user.google_refresh_token
        )
        campaigns = google_ads_service.get_campaigns(
            client=google_client, 
            customer_id=current_user.google_ad_account_id
        )
        return {"campaigns": campaigns}
    except Exception as e:
        logger.error(f"An error occurred while fetching Google campaigns for {current_user.email}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve Google Ads campaigns."
        )

# --- MODIFIED: Endpoint now handles all 3 mock campaigns ---
@router.get("/google/campaigns/{campaign_id}/performance")
async def get_google_campaign_performance(
    campaign_id: str,
    current_user: CurrentUserDependency
):
    logger.info(f"Fetching performance for campaign ID: {campaign_id}")

    performance_to_process = None
    if campaign_id == MOCK_CAMPAIGN_PERFORMANCE_1["campaign_id"]:
        logger.info("Returning MOCK performance data for campaign 1.")
        performance_to_process = MOCK_CAMPAIGN_PERFORMANCE_1
    elif campaign_id == MOCK_CAMPAIGN_PERFORMANCE_2["campaign_id"]:
        logger.info("Returning MOCK performance data for campaign 2.")
        performance_to_process = MOCK_CAMPAIGN_PERFORMANCE_2
    # --- ADD THIS ELIF BLOCK ---
    elif campaign_id == MOCK_CAMPAIGN_PERFORMANCE_3["campaign_id"]:
        logger.info("Returning MOCK performance data for Meta campaign 3.")
        performance_to_process = MOCK_CAMPAIGN_PERFORMANCE_3
    # --- END OF ADDED BLOCK ---

    if performance_to_process:
        total_impressions = sum(day['impressions'] for day in performance_to_process['performance_data'])
        total_clicks = sum(day['clicks'] for day in performance_to_process['performance_data'])
        total_cost = sum(day['cost_micros'] for day in performance_to_process['performance_data']) / 1000000
        reach = int(total_impressions * 0.85) # Mock reach
        frequency = round(total_impressions / reach, 2) if reach > 0 else 0
        cpm = round((total_cost / total_impressions) * 1000, 2) if total_impressions > 0 else 0
        conversions = int(total_clicks * 0.05) # Mock conversions
        cpa = round(total_cost / conversions, 2) if conversions > 0 else 0
        ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0
        avg_cpc = (total_cost / total_clicks) if total_clicks > 0 else 0

        return {
            "trends": performance_to_process['performance_data'],
            "statistics": {
                "impressions": total_impressions, "clicks": total_clicks, "ctr": round(ctr, 2),
                "cost": round(total_cost, 2), "avg_cpc": round(avg_cpc, 2), "reach": reach,
                "frequency": frequency, "cpm": cpm, "conversions": conversions, "cpa": cpa,
            }
        }
    
    logger.warning(f"No mock performance data found for campaign {campaign_id}. Returning zeros.")
    return { "trends": [], "statistics": { "impressions": 0, "clicks": 0, "cost": 0, "ctr": 0, "avg_cpc": 0, "reach": 0, "frequency": 0, "cpm": 0, "conversions": 0, "cpa": 0 } }