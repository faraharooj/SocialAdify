# D:/socialadify/backend/app/api/ads/meta_router.py

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

from app.schemas.user import UserInDB, PyObjectId as UserPyObjectId
from app.core.security import get_current_active_user
from app.db.session import get_database
from app.services import meta_ads_service # We will use this later
from app.crud import meta_ad_creative as meta_ad_crud # Import our new CRUD file

# --- Import the new Meta schemas ---
from app.api.ads.meta_schemas import (
    MetaAdCreativePublic, MetaAdCreativePayload, MetaAdCreativeUpdate, MetaAdCreativeInDB
)
# ---

router = APIRouter()
logger = logging.getLogger(__name__)

# --- Use the same static folder as Google Ads for ad images ---
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent.parent
AD_CREATIVE_IMAGES_DIR = _BACKEND_ROOT / "static" / "ad_creative_images"
AD_CREATIVE_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
# ---

DbDependency = Annotated[AsyncIOMotorDatabase, Depends(get_database)]
CurrentUserDependency = Annotated[UserInDB, Depends(get_current_active_user)]

# --- Helper Function ---
def _to_meta_ad_public(ad_db: MetaAdCreativeInDB) -> MetaAdCreativePublic:
    """
    Converts the Meta database model to the public-facing API model.
    """
    return MetaAdCreativePublic(
        id=str(ad_db.id),
        user_id=str(ad_db.user_id),
        **ad_db.model_dump(exclude={'id', 'user_id'})
    )

# --- CRUD Endpoints for Meta Ads ---

@router.post(
    "/",
    response_model=MetaAdCreativePublic,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new Meta Ad Creative Draft"
)
async def create_new_meta_ad_draft(
    current_user: CurrentUserDependency,
    db: DbDependency,
    ad_data_json: str = Form(..., description="A JSON string of the MetaAdCreativePayload"),
    image_file: UploadFile = File(..., description="A single ad image")
):
    logger.info(f"User {current_user.email} creating new Meta ad draft with image.")

    # --- Image File Handling (similar to scheduler) ---
    if not image_file.content_type or not image_file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only images are allowed.")

    file_extension = Path(image_file.filename).suffix.lower() if image_file.filename else ".jpg"
    allowed_extensions = [".jpg", ".jpeg", ".png", ".webp"]
    if file_extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Unsupported image extension: {file_extension}.")
    
    timestamp = int(time.time())
    unique_filename = f"user_{str(current_user.id)}_time_{timestamp}_meta{file_extension}"
    file_path_on_disk = AD_CREATIVE_IMAGES_DIR / unique_filename
    
    try:
        with open(file_path_on_disk, "wb") as buffer:
            shutil.copyfileobj(image_file.file, buffer)
        logger.info(f"Meta ad creative image saved for user {current_user.email} to: {file_path_on_disk}")
    except Exception as e:
        logger.error(f"Failed to save meta ad image for {current_user.email}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Could not save image for ad creative.")
    finally:
        image_file.file.close()

    image_url_path = f"/static/ad_creative_images/{unique_filename}"
    # --- End Image File Handling ---

    try:
        # Parse the JSON string data
        ad_data_dict = json.loads(ad_data_json)
        ad_data = MetaAdCreativePayload(**ad_data_dict)
    except Exception as e:
        logger.warning(f"Invalid JSON data for meta ad creative: {e}", exc_info=True)
        if file_path_on_disk.exists():
            try: os.remove(file_path_on_disk)
            except Exception as e_del: logger.error(f"Error deleting orphaned image {file_path_on_disk}: {e_del}")
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Invalid ad data JSON: {e}")

    try:
        user_object_id = UserPyObjectId(str(current_user.id))
        ad_db = await meta_ad_crud.create_meta_ad_creative(
            db=db,
            user_id=user_object_id,
            ad_data=ad_data,
            image_url=image_url_path
        )
        return _to_meta_ad_public(ad_db)
    except Exception as e:
        logger.error(f"Failed to create meta ad draft for user {current_user.email}: {e}", exc_info=True)
        if file_path_on_disk.exists():
            try: os.remove(file_path_on_disk)
            except Exception as e_del: logger.error(f"Error deleting orphaned image {file_path_on_disk}: {e_del}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get(
    "/",
    response_model=List[MetaAdCreativePublic],
    summary="List all user Meta Ad Creative Drafts"
)
async def list_user_meta_ad_creatives(
    current_user: CurrentUserDependency,
    db: DbDependency,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200)
):
    logger.info(f"User {current_user.email} fetching meta ad drafts.")
    user_object_id = UserPyObjectId(str(current_user.id))
    ads_db = await meta_ad_crud.get_all_meta_ad_creatives_by_user(db, user_id=user_object_id, skip=skip, limit=limit)
    return [_to_meta_ad_public(ad) for ad in ads_db]

@router.delete(
    "/{ad_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a Meta Ad Creative Draft"
)
async def delete_meta_ad_draft(
    ad_id: Annotated[str, FastApiPath(description="The ID of the ad draft to delete")],
    current_user: CurrentUserDependency,
    db: DbDependency,
    background_tasks: BackgroundTasks
):
    logger.info(f"User {current_user.email} deleting meta ad draft {ad_id}.")
    try:
        ad_object_id = UserPyObjectId(ad_id)
        user_object_id = UserPyObjectId(str(current_user.id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ad ID format.")

    ad_to_delete = await meta_ad_crud.get_meta_ad_creative_by_id(db, ad_id=ad_object_id, user_id=user_object_id)
    if not ad_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ad draft not found or access denied.")
    
    image_url_to_delete = ad_to_delete.image_url

    success = await meta_ad_crud.delete_meta_ad_creative(db, ad_id=ad_object_id, user_id=user_object_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Failed to delete ad draft.")

    if image_url_to_delete and image_url_to_delete.startswith("/static/ad_creative_images/"):
        filename = image_url_to_delete.split("/")[-1]
        file_path_to_delete = AD_CREATIVE_IMAGES_DIR / filename
        
        def delete_image_file(path_to_delete: Path):
            if path_to_delete.exists():
                try:
                    os.remove(path_to_delete)
                    logger.info(f"Ad creative image file deleted: {path_to_delete}")
                except Exception as e_del:
                    logger.error(f"Error deleting ad image file {path_to_delete}: {e_del}")
            else:
                logger.warning(f"Ad creative image file not found for deletion: {path_to_delete}")
        
        background_tasks.add_task(delete_image_file, file_path_to_delete)
    
    return None

    # --- Publishing Endpoint (UPDATED) ---
@router.post(
    "/publish/{ad_id}",
    response_model=MetaAdCreativePublic,
    summary="Publish a Meta Ad Draft to Facebook/Instagram"
)
async def publish_ad_to_meta(
    ad_id: Annotated[str, FastApiPath(description="The ID of the ad draft to publish")],
    current_user: CurrentUserDependency,
    db: DbDependency
):
    logger.info(f"User {current_user.email} requesting to publish Meta Ad {ad_id}.")
    
    try:
        ad_object_id = UserPyObjectId(ad_id)
        user_object_id = UserPyObjectId(str(current_user.id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ad ID format.")

    # 1. Get the ad from our database
    ad_draft = await meta_ad_crud.get_meta_ad_creative_by_id(db, ad_id=ad_object_id, user_id=user_object_id)
    if not ad_draft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ad draft not found.")
    if ad_draft.status == "PUBLISHED":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This ad has already been published.")
        
    # 2. Check for required user credentials
    if not current_user.meta_ad_account_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No Meta Ad Account is linked. Please connect one on the Connections page.")
    if not current_user.linked_page_access_token or not current_user.linked_page_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No Meta Page is linked. Please select one on the Connections page.")
    
    # 3. Check for image URL
    if not ad_draft.image_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot publish ad: Image is missing.")

    # 4. Get absolute path to image
    image_filename = Path(ad_draft.image_url).name
    image_absolute_path = AD_CREATIVE_IMAGES_DIR / image_filename
    if not image_absolute_path.exists():
        logger.error(f"Image file not found at {image_absolute_path} for ad {ad_id}")
        raise HTTPException(status_code=500, detail="Ad image file not found on server.")

    # 5. Call the new service
    try:
        await meta_ads_service.publish_meta_ad(
            current_user=current_user,
            ad_draft=ad_draft,
            image_path=image_absolute_path
        )
        
        # 6. Update status in our DB
        await meta_ad_crud.update_meta_ad_creative_status(db, ad_id=ad_object_id, new_status="PUBLISHED")

    except Exception as e:
        logger.error(f"Failed to publish meta ad {ad_id}: {e}", exc_info=True)
        # Save the error message to the draft
        await meta_ad_crud.update_meta_ad_creative_status(db, ad_id=ad_object_id, new_status="FAILED", error_message=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to publish to Meta: {e}")

    # 7. Return the updated ad
    updated_ad = await meta_ad_crud.get_meta_ad_creative_by_id(db, ad_id=ad_object_id, user_id=user_object_id)
    if not updated_ad:
         raise HTTPException(status_code=404, detail="Ad not found after update.")

    return _to_meta_ad_public(updated_ad)

@router.get(
    "/campaigns",
    summary="List all Meta Ads Campaigns",
    # We don't define a response_model here to keep it flexible,
    # but it will return {"campaigns": [...]}
)
async def get_meta_campaigns_list(
    current_user: CurrentUserDependency
):
    """
    Fetches all Meta Ads campaigns (not drafts) for the user's linked account.
    """
    logger.info(f"User {current_user.email} fetching their Meta campaigns.")
    
    if not current_user.meta_ad_account_id or not current_user.linked_page_access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Meta account is not fully configured. Please connect a Meta Page and Ad Account."
        )

    try:
        campaigns = await meta_ads_service.get_meta_campaigns(current_user=current_user)
        # Return in the same format as the Google Ads router for consistency
        return {"campaigns": campaigns}
    except Exception as e:
        logger.error(f"Failed to retrieve Meta campaigns for {current_user.email}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )