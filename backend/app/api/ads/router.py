# D:\socialadify\backend\app\api\ads\router.py
from fastapi import (
    APIRouter, Depends, HTTPException, status, 
    Query, Path as FastApiPath, UploadFile, File, Form, BackgroundTasks
)
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Annotated, List, Optional
import logging
from bson import ObjectId
import json
from pathlib import Path
import os
import shutil
import time

from app.schemas.user import UserInDB, PyObjectId as UserPyObjectId # Keep this for user
from app.core.security import get_current_active_user
from app.db.session import get_database
from app.services import gemini_service, google_ads_service
from app.crud import ad_creative as ad_crud

# --- Import from new schema ---
from app.api.ads.schemas import (
    AdCreativePublic, AdCreativePayload, AdCreativeUpdate, AdCreativeInDB,
    AIPlatformSuggestionRequest, AIPlatformSuggestionResponse
)
# ---

router = APIRouter()
logger = logging.getLogger(__name__)

# --- Static File Directory Setup ---
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent.parent
AD_CREATIVE_IMAGES_DIR = _BACKEND_ROOT / "static" / "ad_creative_images"
AD_CREATIVE_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
# ---

DbDependency = Annotated[AsyncIOMotorDatabase, Depends(get_database)]
CurrentUserDependency = Annotated[UserInDB, Depends(get_current_active_user)]

# --- Helper Function ---
def _to_ad_creative_public(ad_db: AdCreativeInDB) -> AdCreativePublic:
    """
    Converts the database model to the public-facing API model.
    """
    return AdCreativePublic(
        id=str(ad_db.id),
        user_id=str(ad_db.user_id),
        **ad_db.model_dump(exclude={'id', 'user_id'})
    )

# --- AI Recommendation Endpoint ---
# --- UPDATED: Removed 'audience' from the service call ---
@router.post(
    "/recommend",
    response_model=AIPlatformSuggestionResponse,
    summary="Get AI-powered platform recommendation"
)
async def get_platform_recommendation(
    request: AIPlatformSuggestionRequest,
    current_user: CurrentUserDependency
):
    logger.info(f"User {current_user.email} requesting platform recommendation.")
    try:
        recommendation = await gemini_service.get_platform_recommendation(
            ad_goal=request.ad_goal,
            audience_description=request.audience_description,
            product_description=request.product_description
        )
        return AIPlatformSuggestionResponse(**recommendation)
    except Exception as e:
        logger.error(f"Error getting AI recommendation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get AI recommendation."
        )

# --- CRUD Endpoints ---

# --- This endpoint is already compatible with the 2-image upload ---
@router.post(
    "/",
    response_model=AdCreativePublic,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new Ad Creative Draft"
)
async def create_new_ad_draft(
    current_user: CurrentUserDependency,
    db: DbDependency,
    ad_data_json: str = Form(..., description="A JSON string of the AdCreativePayload"),
    image_file_square: UploadFile = File(..., description="Square 1:1 image"),
    image_file_landscape: UploadFile = File(..., description="Landscape 1.91:1 image")
):
    logger.info(f"User {current_user.email} creating new ad draft with 2 images.")

    # --- Helper function to save a file ---
    def save_image_file(image_file: UploadFile, suffix: str) -> Path:
        if not image_file.content_type or not image_file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail=f"Invalid file type for {suffix} image. Only images are allowed.")
        
        file_extension = Path(image_file.filename).suffix.lower() if image_file.filename else ".jpg"
        allowed_extensions = [".jpg", ".jpeg", ".png", ".webp"] # Webp is allowed for saving
        if file_extension not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"Unsupported image extension for {suffix}: {file_extension}.")
        
        timestamp = int(time.time())
        unique_filename = f"user_{str(current_user.id)}_time_{timestamp}_{suffix}{file_extension}"
        file_path_on_disk = AD_CREATIVE_IMAGES_DIR / unique_filename
        
        try:
            with open(file_path_on_disk, "wb") as buffer:
                shutil.copyfileobj(image_file.file, buffer)
            logger.info(f"Ad creative image ({suffix}) saved for user {current_user.email} to: {file_path_on_disk}")
            return file_path_on_disk
        except Exception as e:
            logger.error(f"Failed to save ad creative image ({suffix}) for {current_user.email}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Could not save image for ad creative ({suffix}).")
        finally:
            image_file.file.close()

    # --- Save both images ---
    file_path_square = None
    file_path_landscape = None
    try:
        file_path_square = save_image_file(image_file_square, "1x1")
        file_path_landscape = save_image_file(image_file_landscape, "1.91x1")
    except HTTPException as e:
        # Clean up if one file saved but the other failed
        if file_path_square and file_path_square.exists(): os.remove(file_path_square)
        if file_path_landscape and file_path_landscape.exists(): os.remove(file_path_landscape)
        raise e

    image_url_square_path = f"/static/ad_creative_images/{file_path_square.name}"
    image_url_landscape_path = f"/static/ad_creative_images/{file_path_landscape.name}"
    
    # --- Parse JSON Data ---
    try:
        ad_data_dict = json.loads(ad_data_json)
        ad_data = AdCreativePayload(**ad_data_dict)
    except Exception as e:
        logger.warning(f"Invalid JSON data for ad creative: {e}", exc_info=True)
        # Delete the orphaned images
        if file_path_square.exists(): os.remove(file_path_square)
        if file_path_landscape.exists(): os.remove(file_path_landscape)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Invalid ad data JSON: {e}")

    # --- Create DB Entry ---
    try:
        user_object_id = UserPyObjectId(str(current_user.id))
        ad_db = await ad_crud.create_ad_creative(
            db=db,
            user_id=user_object_id,
            ad_data=ad_data,
            image_url_square=image_url_square_path,
            image_url_landscape=image_url_landscape_path
        )
        return _to_ad_creative_public(ad_db)
    except Exception as e:
        logger.error(f"Failed to create ad draft for user {current_user.email}: {e}", exc_info=True)
        # Delete the orphaned images
        if file_path_square.exists(): os.remove(file_path_square)
        if file_path_landscape.exists(): os.remove(file_path_landscape)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get(
    "/",
    response_model=List[AdCreativePublic],
    summary="List all user Ad Creative Drafts"
)
async def list_user_ad_creatives(
    current_user: CurrentUserDependency,
    db: DbDependency,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200)
):
    logger.info(f"User {current_user.email} fetching ad drafts.")
    user_object_id = UserPyObjectId(str(current_user.id))
    ads_db = await ad_crud.get_all_ad_creatives_by_user(db, user_id=user_object_id, skip=skip, limit=limit)
    return [_to_ad_creative_public(ad) for ad in ads_db]

# --- UPDATED TO HANDLE TWO IMAGE DELETIONS ---
@router.delete(
    "/{ad_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an Ad Creative Draft"
)
async def delete_ad_draft(
    ad_id: Annotated[str, FastApiPath(description="The ID of the ad draft to delete")],
    current_user: CurrentUserDependency,
    db: DbDependency,
    background_tasks: BackgroundTasks # <-- Add background tasks
):
    logger.info(f"User {current_user.email} deleting ad draft {ad_id}.")
    try:
        ad_object_id = UserPyObjectId(ad_id)
        user_object_id = UserPyObjectId(str(current_user.id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ad ID format.")

    # Get the ad first to find its image URLs
    ad_to_delete = await ad_crud.get_ad_creative_by_id(db, ad_id=ad_object_id, user_id=user_object_id)
    if not ad_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ad draft not found or access denied.")
    
    # --- Get both image URLs ---
    image_urls_to_delete = [
        ad_to_delete.image_url_square,
        ad_to_delete.image_url_landscape
    ]

    # Delete the database record
    success = await ad_crud.delete_ad_creative(db, ad_id=ad_object_id, user_id=user_object_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Failed to delete ad draft.")

    # --- Helper for background deletion ---
    def delete_image_file(path_to_delete: Path):
        if path_to_delete.exists():
            try:
                os.remove(path_to_delete)
                logger.info(f"Ad creative image file deleted: {path_to_delete}")
            except Exception as e_del:
                logger.error(f"Error deleting ad image file {path_to_delete}: {e_del}")
        else:
            logger.warning(f"Ad creative image file not found for deletion: {path_to_delete}")

    # --- Add background task to delete both image files ---
    for img_url in image_urls_to_delete:
        if img_url and img_url.startswith("/static/ad_creative_images/"):
            filename = img_url.split("/")[-1]
            file_path_to_delete = AD_CREATIVE_IMAGES_DIR / filename
            background_tasks.add_task(delete_image_file, file_path_to_delete)
    
    return None

# --- Publishing Endpoint ---
@router.post(
    "/publish/google/{ad_id}",
    response_model=AdCreativePublic,
    summary="Publish an Ad Draft to Google Ads"
)
async def publish_ad_to_google_ads(
    ad_id: Annotated[str, FastApiPath(description="The ID of the ad draft to publish")],
    current_user: CurrentUserDependency,
    db: DbDependency
):
    logger.info(f"User {current_user.email} publishing Google Ad {ad_id}.")
    try:
        ad_object_id = UserPyObjectId(ad_id)
        user_object_id = UserPyObjectId(str(current_user.id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ad ID format.")

    # 1. Get the ad from our database
    ad_draft = await ad_crud.get_ad_creative_by_id(db, ad_id=ad_object_id, user_id=user_object_id)
    if not ad_draft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ad draft not found.")
    if ad_draft.status == "PUBLISHED":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This ad has already been published.")
    if ad_draft.platform != "GOOGLE":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This ad is not designated for Google.")
    
    # --- UPDATED: Check for both image URLs ---
    if not ad_draft.image_url_square or not ad_draft.image_url_landscape:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot publish ad: Both a square (1:1) and landscape (1.91:1) image are required.")

    # 2. Get the user's Google refresh token
    if not current_user.google_refresh_token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Google Ads account is not linked.")

    # 3. Get the Google Ads Customer ID
    google_customer_id = current_user.google_ad_account_id
    if not google_customer_id:
        logger.warning(f"User {current_user.email} has no Google Ads Customer ID. Publishing will likely fail or use a default.")
        from app.core.config import TEST_GOOGLE_CUSTOMER_ID
        google_customer_id = TEST_GOOGLE_CUSTOMER_ID
        if not google_customer_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No Google Ads Customer ID is configured for this user.")

    try:
        # 4. Initialize Google Ads Client
        client = google_ads_service.get_google_ads_client(current_user.google_refresh_token)
        
        # --- UPDATED: Get absolute paths for both images ---
        image_filename_square = Path(ad_draft.image_url_square).name
        image_path_square = AD_CREATIVE_IMAGES_DIR / image_filename_square
        
        image_filename_landscape = Path(ad_draft.image_url_landscape).name
        image_path_landscape = AD_CREATIVE_IMAGES_DIR / image_filename_landscape

        if not image_path_square.exists() or not image_path_landscape.exists():
            logger.error(f"One or more image files not found for ad {ad_id}")
            raise HTTPException(status_code=500, detail="Ad image files not found on server.")
        
        # 5. Call the service to create the campaign
        campaign_resource_name = await google_ads_service.create_paused_ad_campaign(
            client=client,
            customer_id=google_customer_id,
            ad_draft=ad_draft,
            # --- UPDATED: Pass both image paths ---
            image_path_square=str(image_path_square),
            image_path_landscape=str(image_path_landscape)
        )
        logger.info(f"Successfully created campaign: {campaign_resource_name}")

        # 6. Update our database
        await ad_crud.update_ad_creative_status(db, ad_id=ad_object_id, new_status="PUBLISHED")

    except Exception as e:
        logger.error(f"Failed to publish ad {ad_id} to Google: {e}", exc_info=True)
        await ad_crud.update_ad_creative_status(db, ad_id=ad_object_id, new_status="FAILED", error_message=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to publish to Google Ads: {e}")

    # 7. Return the updated ad
    updated_ad = await ad_crud.get_ad_creative_by_id(db, ad_id=ad_object_id, user_id=user_object_id)
    if not updated_ad:
         raise HTTPException(status_code=404, detail="Ad not found after update.") # Should not happen
    return _to_ad_creative_public(updated_ad)