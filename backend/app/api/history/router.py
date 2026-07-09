# D:\socialadify\backend\app\api\history\router.py
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from typing import List, Union
from app.core.security import get_current_active_user
from app.schemas.user import UserInDB
from app.db.session import get_database
import logging

from app.crud import caption as caption_crud
from app.crud import generated_post as post_crud
from app.api.captions.schemas import CaptionPublic
from app.api.post_generator.schemas import GeneratedPostPublic

router = APIRouter()
CurrentUserDependency = Depends(get_current_active_user)
DbDependency = Depends(get_database)
logger = logging.getLogger(__name__)

# This Union is now used for internal type hinting only
HistoryItem = Union[CaptionPublic, GeneratedPostPublic]

# --- MODIFIED: Created separate, explicit formatters for each item type ---

def format_caption_item(item: CaptionPublic) -> dict:
    """Explicitly formats a caption item into a dictionary for the frontend."""
    return {
        "id": str(item.id),
        "user_id": str(item.user_id),
        # --- THIS IS THE FIX: Access 'caption_text' instead of 'caption' ---
        "caption": item.caption_text,
        "created_at": item.created_at.isoformat(),
        "item_type": "caption"
    }

def format_post_item(item: GeneratedPostPublic) -> dict:
    """
    Explicitly formats a post item into a dictionary for the frontend.
    It maps 'prompt_used' to 'caption' as the frontend expects this field.
    """
    return {
        "id": str(item.id),
        "user_id": str(item.user_id),
        "caption": item.prompt_used,  # Map prompt to the base 'caption' field
        "image_url": item.image_url,
        "created_at": item.created_at.isoformat(),
        "item_type": "post"
    }

@router.get("/")
async def get_unified_history(
    current_user: UserInDB = CurrentUserDependency,
    db = DbDependency
):
    """
    Fetches and combines a user's saved captions and generated visual posts,
    sorted by creation date to create a unified history timeline.
    """
    user_id = current_user.id
    
    # 1. Fetch all items from the database (unchanged)
    captions_in_db = await caption_crud.get_captions_by_user_id(db=db, user_id=user_id, limit=1000)
    posts_in_db = await post_crud.get_generated_posts_by_user_id(db=db, user_id=user_id)
    
    # 2. --- THIS IS THE DEFINITIVE FIX ---
    # Process each list with its own dedicated, explicit formatting function.
    # This guarantees that the structure is exactly what the frontend needs.
    typed_captions = [format_caption_item(caption) for caption in captions_in_db]
    typed_posts = [format_post_item(post) for post in posts_in_db]
        
    # 3. Combine and sort the processed lists (unchanged)
    combined_history = typed_captions + typed_posts
    combined_history.sort(key=lambda item: item['created_at'], reverse=True)
    
    # 4. Return as a JSONResponse to ensure the data is sent as-is.
    return JSONResponse(content=combined_history)

