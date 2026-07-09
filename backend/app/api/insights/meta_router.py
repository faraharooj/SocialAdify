from fastapi import APIRouter, Depends, HTTPException, status, Query
import logging
from typing import Annotated, Dict, Any, List, Optional
from datetime import date, datetime
import asyncio
import httpx

from app.core.security import get_current_active_user
from app.schemas.user import UserInDB
from app.db.session import get_database # Import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase # Import AsyncIOMotorDatabase

# --- Import our new schemas and service functions ---
from app.api.insights.schemas import (
    PageInsightsResponse, PageInsightMetrics, 
    PostInsightsResponse, PostInsight,
    PostReactions # <-- IMPORT PostReactions
)
from app.services import meta_service

# --- Dependencies ---
CurrentUserDependency = Annotated[UserInDB, Depends(get_current_active_user)]
# --- NEW: Add Database Dependency ---
DbDependency = Annotated[AsyncIOMotorDatabase, Depends(get_database)]


# --- Router Setup ---
router = APIRouter()
logger = logging.getLogger(__name__)

#
# --- EXISTING MOCK AD CAMPAIGN ENDPOINT (UNCHANGED) ---
#

MOCK_CAMPAIGN_DATA: Dict[str, List[Dict[str, Any]]] = {
    "data": [
        {
            "id": "120202304128940123", "name": "Summer Sale 2024 - Traffic", "status": "PAUSED",
            "objective": "OUTCOME_TRAFFIC", "spend": "152.34", "impressions": "25432",
            "clicks": "1289", "cpc": "0.12", "ctr": "5.07", "created_time": "2024-06-15T10:00:00-0700"
        },
        {
            "id": "120202304128940456", "name": "New Product Launch - Leads", "status": "ACTIVE",
            "objective": "OUTCOME_LEADS", "spend": "345.67", "impressions": "45123",
            "clicks": "2103", "cpc": "0.16", "ctr": "4.66", "created_time": "2024-07-01T12:30:00-0700"
        },
        {
            "id": "120202304128940789", "name": "Brand Awareness Campaign", "status": "ARCHIVED",
            "objective": "OUTCOME_AWARENESS", "spend": "500.00", "impressions": "150876",
            "clicks": "1502", "cpc": "0.33", "ctr": "0.99", "created_time": "2024-05-20T09:00:00-0700"
        }
    ],
    "paging": {"cursors": {"before": "MAZDZD", "after": "MAZDZD"}}
}


@router.get("/campaigns", status_code=status.HTTP_200_OK)
async def get_meta_ad_campaigns(current_user: CurrentUserDependency):
    """
    Returns a list of realistic MOCK ad campaigns for the authenticated user.
    """
    logger.info(f"Fetching MOCK Meta ad campaigns for user: {current_user.email}")

    # Note: This check is for AD accounts, which is different from organic page accounts
    if not hasattr(current_user, 'meta_ad_account_id') or not hasattr(current_user, 'meta_access_token'):
        logger.warning(f"User {current_user.email} attempted to fetch campaigns without Meta ad credentials.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Meta Ad account not connected. Please connect your account in the settings.",
        )

    logger.info(f"Successfully returned {len(MOCK_CAMPAIGN_DATA.get('data', []))} mock campaigns for user {current_user.email}")
    return MOCK_CAMPAIGN_DATA


#
# --- NEW ORGANIC INSIGHTS ENDPOINTS START HERE ---
#

def _get_user_meta_creds(user: UserInDB, platform: str) -> Dict[str, str]:
    """Helper to get the correct ID and token based on platform."""
    if platform == "facebook":
        if not user.linked_page_id or not user.linked_page_access_token:
            raise HTTPException(status_code=400, detail="Facebook Page not linked.")
        return {"id": user.linked_page_id, "token": user.linked_page_access_token}
    elif platform == "instagram":
        if not user.linked_instagram_id or not user.linked_page_access_token:
            raise HTTPException(status_code=400, detail="Instagram Account not linked.")
        return {"id": user.linked_instagram_id, "token": user.linked_page_access_token}
    else:
        raise HTTPException(status_code=400, detail="Invalid platform. Must be 'facebook' or 'instagram'.")

def _process_page_insights_data(
    raw_data: List[Dict[str, Any]], 
    platform: str, 
    fb_follower_data: Optional[Dict[str, Any]] = None
) -> PageInsightsResponse:
    """
    Transforms Meta's complex, metric-first data structure into a simple,
    date-first structure for our charts.
    """
    processed_data: Dict[str, Dict[str, Any]] = {}
    totals: Dict[str, int] = {"impressions": 0, "reach": 0, "engagement": 0}

    # Helper to map Meta's metric names to our schema names
    metric_map = {
        "facebook": {
            "page_impressions": "impressions",
            "page_impressions_unique": "reach",
            "page_post_engagements": "engagement",
        },
        "instagram": {
            "impressions": "impressions",
            "reach": "reach",
            "follower_count": "follower_count" 
            # Note: IG 'engagement' is not a daily page metric, it's per-post
        }
    }
    
    for metric_data in raw_data:
        metric_name_raw = metric_data.get("name")
        metric_name_clean = metric_map[platform].get(metric_name_raw)
        
        if metric_name_clean:
            for value_entry in metric_data.get("values", []):
                value = value_entry.get("value", 0)
                date_str = value_entry.get("end_time", "").split("T")[0]
                
                if not date_str:
                    continue
                
                if date_str not in processed_data:
                    processed_data[date_str] = {"date": datetime.fromisoformat(date_str).date()}
                
                processed_data[date_str][metric_name_clean] = value
                if metric_name_clean in totals:
                    totals[metric_name_clean] += value

    # For Facebook, 'page_fans' (followers) is a separate metric, not a list of values
    if fb_follower_data:
        try:
            # Get the last value from the follower data
            follower_count = fb_follower_data.get("values", [{}])[-1].get("value")
            if follower_count:
                totals["follower_count"] = follower_count
        except (IndexError, TypeError):
            pass # No follower data found

    # Convert the processed dict to a list for the Pydantic model
    # --- FIX: Use 'data' key for PageInsightMetrics list ---
    data_list = sorted(processed_data.values(), key=lambda x: x['date'])
    return PageInsightsResponse(platform=platform, data=data_list, totals=totals)


@router.get("/page-insights", response_model=PageInsightsResponse)
async def get_page_insights(
    current_user: CurrentUserDependency,
    platform: str = Query(..., description="Platform to fetch insights for ('facebook' or 'instagram')"),
    start_date: date = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: date = Query(..., description="End date (YYYY-MM-DD)")
):
    """
    Provides aggregated, time-series insights for a linked Facebook Page
    or Instagram Account. Ideal for charts.
    """
    logger.info(f"Fetching {platform} page insights for user {current_user.email} from {start_date} to {end_date}")
    creds = _get_user_meta_creds(current_user, platform)
    
    # Convert dates to datetimes for the service
    start_time = datetime.combine(start_date, datetime.min.time())
    end_time = datetime.combine(end_date, datetime.max.time())

    try:
        if platform == "facebook":
            raw_data = await meta_service.get_facebook_page_insights(
                page_id=creds["id"],
                page_access_token=creds["token"],
                since=start_time,
                until=end_time
            )
            # Facebook follower count is a separate call (not daily)
            fb_follower_data = next((m for m in raw_data if m.get("name") == "page_fans"), None)
            
            return _process_page_insights_data(raw_data, "facebook", fb_follower_data)
        
        else: # Instagram
            raw_data = await meta_service.get_instagram_account_insights(
                instagram_id=creds["id"],
                page_access_token=creds["token"],
                since=start_time,
                until=end_time
            )
            return _process_page_insights_data(raw_data, "instagram")

    # --- FIX 1: Handle the 93-Day Limit Gracefully ---
    except httpx.HTTPStatusError as e:
        error_resp = e.response.json().get("error", {})
        error_msg = error_resp.get("message", "")
        error_user_msg = error_resp.get("error_user_msg", "")
        
        # Meta Error Code 100 / Subcode 1504016 = Date range too long
        if "93 days" in error_user_msg or "93 days" in error_msg:
            raise HTTPException(
                status_code=400, 
                detail="Date range too large. Meta limits Insights to a maximum of 93 days. Please select a shorter range."
            )
        
        logger.error(f"HTTP error fetching {platform} insights for {current_user.email}: {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=f"Failed to fetch from Meta: {e.response.json()}")

    except httpx.ConnectTimeout:
        raise HTTPException(status_code=504, detail="Request timed out. Please reduce the date range.")

    except Exception as e:
        logger.error(f"Error fetching {platform} insights: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


@router.get("/post-insights", response_model=PostInsightsResponse)
async def get_post_insights(
    current_user: CurrentUserDependency,
    platform: str = Query(..., description="Platform to fetch posts for ('facebook' or 'instagram')"),
    start_date: date = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: date = Query(..., description="End date (YYYY-MM-DD)")
):
    """
    Provides a list of all posts within a timeframe, each with its
    own specific performance metrics. Ideal for tables.
    """
    logger.info(f"Fetching {platform} post insights for user {current_user.email} from {start_date} to {end_date}")
    creds = _get_user_meta_creds(current_user, platform)
    
    start_time = datetime.combine(start_date, datetime.min.time())
    end_time = datetime.combine(end_date, datetime.max.time())

    try:
        # 1. Get the list of posts
        if platform == "facebook":
            post_list = await meta_service.get_facebook_post_list(
                page_id=creds["id"], page_access_token=creds["token"],
                since=start_time, until=end_time
            )
            get_insights_func = meta_service.get_facebook_post_insights
        else: # Instagram
            post_list = await meta_service.get_instagram_post_list(
                instagram_id=creds["id"], page_access_token=creds["token"],
                since=start_time, until=end_time
            )
            get_insights_func = meta_service.get_instagram_post_insights

        if not post_list:
            return PostInsightsResponse(posts=[])

        # 2. Create a list of async tasks to fetch insights for each post
        tasks = []
        for post in post_list:
            post_id = post.get("id")
            if post_id:
                if platform == "instagram":
                    # Pass media_type for Instagram (Video/Image logic)
                    media_type = post.get("media_type", "IMAGE")
                    tasks.append(get_insights_func(post_id, creds["token"], media_type)) 
                else:
                    tasks.append(get_insights_func(post_id, creds["token"]))
        
        # 3. Run all insight fetches in parallel
        logger.info(f"Fetching insights for {len(tasks)} {platform} posts in parallel...")
        insight_results = await asyncio.gather(*tasks, return_exceptions=True)
        logger.info("Parallel fetch complete.")

        # 4. Combine post data with its insights
        final_posts = []
        for post, insights in zip(post_list, insight_results):
            if isinstance(insights, Exception):
                logger.warning(f"Failed to get insights for post {post.get('id')}: {insights}")
                continue # Skip this post
            
            # --- THIS IS THE FIX (Part 6) ---
            # Manually add comments and shares from the post_list data
            if platform == "facebook":
                insights['comments'] = post.get('comments', {}).get('summary', {}).get('total_count', 0)
                insights['shares'] = post.get('shares', {}).get('count', 0)
            
            # Ensure 'reactions' key exists even if API fails
            if 'reactions' not in insights:
                insights['reactions'] = PostReactions()
            # --- END OF FIX ---

            final_posts.append(
                PostInsight(
                    post_id=post.get("id"),
                    platform=platform,
                    created_time=post.get("created_time") or post.get("timestamp"),
                    message=post.get("message") or post.get("caption"),
                    **insights # Unpack the insights dict (impressions, reach, etc.)
                )
            )

        return PostInsightsResponse(posts=final_posts)

    # --- FIX 2: Handle Timeouts specifically for Post Insights ---
    except httpx.ConnectTimeout:
        logger.error("Post insights fetch timed out.")
        raise HTTPException(
            status_code=504, 
            detail="Request timed out due to too many posts. Please select a shorter date range (e.g., 1 month)."
        )
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error fetching {platform} posts for {current_user.email}: {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=f"Failed to fetch from Meta: {e.response.json()}")
    except Exception as e:
        logger.error(f"Error fetching {platform} posts: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")