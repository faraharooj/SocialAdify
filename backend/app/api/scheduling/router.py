# D:\socialadify\backend\app\api\scheduling\router.py
from fastapi import (
    APIRouter, Depends, HTTPException, status, 
    UploadFile, File, Form, Query, Path as FastApiPath, BackgroundTasks
)
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Annotated, List, Optional
import os
import shutil
from pathlib import Path
import time
import logging
from bson import ObjectId

from app.schemas.user import UserInDB, PyObjectId
from app.core.security import get_current_active_user
from app.db.session import get_database
# --- This import remains the same, but the function it calls is now the new hybrid model ---
from app.services import gemini_service 
from app.api.scheduling.schemas import ( 
    ScheduledPostCreate, ScheduledPostPublic, ScheduledPostUpdate,
    ScheduledPostInDB,AISuggestionRequest, AISuggestionResponse,CalendarStatusResponse,
)
from app.crud import scheduled_post as scheduler_crud

router = APIRouter()
logger = logging.getLogger(__name__)

_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent.parent
SCHEDULED_POST_IMAGES_DIR = _BACKEND_ROOT / "static" / "scheduled_post_images"
SCHEDULED_POST_IMAGES_DIR.mkdir(parents=True, exist_ok=True)


DbDependency = Annotated[AsyncIOMotorDatabase, Depends(get_database)]
CurrentUserDependency = Annotated[UserInDB, Depends(get_current_active_user)]

# --- UPDATED AI SUGGESTION ENDPOINT ---
# This is the new version of the endpoint, replacing the old one.
@router.post(
    "/suggestion",
    response_model=AISuggestionResponse,
    summary="Get AI-powered time suggestion for scheduling a post"
)
async def get_ai_time_suggestion(
    request: AISuggestionRequest,
    current_user: CurrentUserDependency
):
    logger.info(f"User {current_user.email} requesting AI time suggestion.")
    
    # The timezone for the Pakistani market, as required by the new model service.
    user_timezone = "Asia/Karachi"
    
    try:
        # --- THE FIX ---
        # This now calls the get_optimal_post_time function from our updated service.
        # This function contains the custom model logic and a Gemini fallback.
        suggestion_data = await gemini_service.get_optimal_post_time(
            caption=request.caption,
            platform=request.target_platform,
            is_boosted=request.is_boosted, # This is kept for compatibility
            user_timezone=user_timezone
        )
        
        return AISuggestionResponse(
            suggested_time_utc=suggestion_data['suggested_time_utc'],
            reasoning=suggestion_data['reasoning']
        )

    except Exception as e:
        logger.error(f"Error getting AI time suggestion for {current_user.email}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get a suggestion from the AI model. Please try again later."
        )

# --- (The rest of the file remains completely unchanged) ---
#THeeee calender wala parttt
@router.get(
    "/status",
    response_model=CalendarStatusResponse,
    summary="Get aggregated post status for a given month/year"
)
async def get_calendar_status(
    current_user: CurrentUserDependency,
    db: DbDependency,
    year: Annotated[int, Query(description="The year to query (e.g., 2025)", ge=2024)],
    month: Annotated[int, Query(description="The month to query (1-12)", ge=1, le=12)]
):
    """
    Retrieves the aggregated post statuses (scheduled, failed, completed) for all
    posts belonging to the user within the specified calendar month and year.
    """
    logger.info(f"User {current_user.email} requesting calendar status for {year}-{month}")
    user_object_id = ObjectId(str(current_user.id))
    
    try:
        # 💡 CRUCIAL: We assume the CRUD layer has a function to aggregate this data.
        # This function should perform a MongoDB aggregation to group posts by day
        # and determine the *highest priority* status for that day.
        status_data = await scheduler_crud.get_monthly_post_status(
            db=db,
            user_id=user_object_id,
            year=year,
            month=month
        )
        
        # The CRUD function is expected to return a list of dictionaries matching CalendarDayStatus
        return CalendarStatusResponse(statuses=status_data)

    except Exception as e:
        logger.error(f"Error fetching calendar status for {current_user.email}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve calendar post statuses."
        )
    
#CHANGES END HERE:
def _to_scheduled_post_public(post_db: ScheduledPostInDB) -> ScheduledPostPublic:
    """
    Helper function to convert ScheduledPostInDB instance to ScheduledPostPublic instance.
    """
    return ScheduledPostPublic(
        id=str(post_db.id),
        user_id=str(post_db.user_id),
        caption=post_db.caption,
        scheduled_at=post_db.scheduled_at,
        image_url=post_db.image_url,
        status=post_db.status,
        created_at=post_db.created_at,
        updated_at=post_db.updated_at,
        target_platform=post_db.target_platform,
        auto_post=post_db.auto_post,
        auto_boost=post_db.auto_boost,
        boost_budget=post_db.boost_budget,
        boost_duration_days=post_db.boost_duration_days
    )


@router.post(
    "/", 
    response_model=ScheduledPostPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Schedule a new post"
)
async def create_new_scheduled_post(
    current_user: CurrentUserDependency,
    db: DbDependency,
    caption: str = Form(..., min_length=1, max_length=2200),
    scheduled_at_str: str = Form(...), 
    image_file: UploadFile = File(...), 
    target_platform: Optional[str] = Form(None),
    auto_post: bool = Form(False),
    auto_boost: bool = Form(False),
    boost_budget: Optional[float] = Form(None),
    boost_duration_days: Optional[int] = Form(None)
):
    logger.info(f"User {current_user.email} attempting to schedule a new post.")

    if not image_file.content_type or not image_file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only images are allowed.")

    file_extension = Path(image_file.filename).suffix.lower() if image_file.filename else ".jpg"
    allowed_extensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
    if file_extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Unsupported image extension: {file_extension}.")
    
    timestamp = int(time.time())
    unique_filename = f"user_{str(current_user.id)}_time_{timestamp}{file_extension}"
    file_path_on_disk = SCHEDULED_POST_IMAGES_DIR / unique_filename
    
    try:
        with open(file_path_on_disk, "wb") as buffer:
            shutil.copyfileobj(image_file.file, buffer)
        logger.info(f"Scheduled post image saved for user {current_user.email} to: {file_path_on_disk}")
    except Exception as e:
        logger.error(f"Failed to save scheduled post image for {current_user.email}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Could not save image for scheduled post.")
    finally:
        image_file.file.close()

    image_url_path = f"/static/scheduled_post_images/{unique_filename}"

    post_create_data = ScheduledPostCreate(
        caption=caption,
        scheduled_at_str=scheduled_at_str,
        target_platform=target_platform,
        auto_post=auto_post,
        auto_boost=auto_boost,
        boost_budget=boost_budget,
        boost_duration_days=boost_duration_days
    )

    try:
        user_object_id = ObjectId(str(current_user.id))

        scheduled_post_db = await scheduler_crud.create_scheduled_post(
            db=db, 
            user_id=user_object_id, 
            image_url=image_url_path,
            post_create_data=post_create_data
        )
        return _to_scheduled_post_public(scheduled_post_db)
    except ValueError as ve: 
        logger.warning(f"Validation error creating scheduled post: {ve}")
        if file_path_on_disk.exists():
            try: os.remove(file_path_on_disk)
            except Exception as e_del: logger.error(f"Error deleting orphaned image {file_path_on_disk}: {e_del}")
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to schedule post for user {current_user.email}: {e}", exc_info=True)
        if file_path_on_disk.exists():
            try: os.remove(file_path_on_disk)
            except Exception as e_del: logger.error(f"Error deleting orphaned image {file_path_on_disk}: {e_del}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not schedule post.")


@router.get("/", response_model=List[ScheduledPostPublic], summary="List user's scheduled posts")
async def list_user_scheduled_posts(
    current_user: CurrentUserDependency,
    db: DbDependency,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100)
):
    logger.info(f"Fetching scheduled posts for user: {current_user.email}")
    user_object_id = ObjectId(str(current_user.id))
    posts_db = await scheduler_crud.get_scheduled_posts_by_user(db, user_id=user_object_id, skip=skip, limit=limit)
    return [_to_scheduled_post_public(post) for post in posts_db]


@router.get("/{post_id}", response_model=ScheduledPostPublic, summary="Get a specific scheduled post")
async def get_specific_scheduled_post(
    post_id: Annotated[str, FastApiPath(description="The ID of the scheduled post to retrieve")],
    current_user: CurrentUserDependency,
    db: DbDependency
):
    logger.info(f"User {current_user.email} fetching scheduled post ID: {post_id}")
    try:
        post_object_id = PyObjectId(post_id)
        user_object_id = ObjectId(str(current_user.id))
    except Exception: 
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid post ID format.")

    post_db = await scheduler_crud.get_scheduled_post_by_id_for_user(db, post_id=post_object_id, user_id=user_object_id)
    if not post_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheduled post not found or access denied.")
    return _to_scheduled_post_public(post_db)


@router.put("/{post_id}", response_model=ScheduledPostPublic, summary="Update a scheduled post")
async def update_existing_scheduled_post(
    post_id: Annotated[str, FastApiPath(description="The ID of the scheduled post to update")],
    update_payload: ScheduledPostUpdate, 
    current_user: CurrentUserDependency,
    db: DbDependency
):
    logger.info(f"User {current_user.email} attempting to update scheduled post ID: {post_id}")
    try:
        post_object_id = PyObjectId(post_id)
        user_object_id = ObjectId(str(current_user.id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid post ID format.")

    try:
        updated_post_db = await scheduler_crud.update_scheduled_post(
            db, post_id=post_object_id, user_id=user_object_id, update_data=update_payload
        )
    except ValueError as ve: 
        logger.warning(f"Validation error updating scheduled post {post_id}: {ve}")
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except Exception as e:
        logger.error(f"Error updating scheduled post {post_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not update scheduled post.")

    if not updated_post_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheduled post not found or access denied for update.")
    return _to_scheduled_post_public(updated_post_db)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a scheduled post")
async def delete_existing_scheduled_post(
    post_id: Annotated[str, FastApiPath(description="The ID of the scheduled post to delete")],
    current_user: CurrentUserDependency,
    db: DbDependency,
    background_tasks: BackgroundTasks 
):
    logger.info(f"User {current_user.email} attempting to delete scheduled post ID: {post_id}")
    try:
        post_object_id = PyObjectId(post_id)
        user_object_id = ObjectId(str(current_user.id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid post ID format.")

    post_to_delete = await scheduler_crud.get_scheduled_post_by_id_for_user(db, post_id=post_object_id, user_id=user_object_id)
    if not post_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheduled post not found or access denied.")

    image_url_to_delete = post_to_delete.image_url 

    success = await scheduler_crud.delete_scheduled_post(db, post_id=post_object_id, user_id=user_object_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheduled post not found or failed to delete.")

    if image_url_to_delete and image_url_to_delete.startswith("/static/scheduled_post_images/"):
        filename = image_url_to_delete.split("/")[-1]
        file_path_to_delete = SCHEDULED_POST_IMAGES_DIR / filename
        
        def delete_image_file(path_to_delete: Path):
            if path_to_delete.exists():
                try:
                    os.remove(path_to_delete)
                    logger.info(f"Scheduled post image file deleted: {path_to_delete}")
                except Exception as e_del:
                    logger.error(f"Error deleting scheduled post image file {path_to_delete}: {e_del}")
            else:
                logger.warning(f"Scheduled post image file not found for deletion: {path_to_delete}")
        
        background_tasks.add_task(delete_image_file, file_path_to_delete)
    
    return None

