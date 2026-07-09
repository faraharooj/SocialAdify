# D:/socialadify/backend/app/api/templates/router.py
from fastapi import APIRouter, Depends, HTTPException, status, Request, File, Form, UploadFile
from typing import List, Optional, Any, Dict, Annotated
from app.core.security import get_current_active_user
from app.schemas.user import UserInDB, PyObjectId
from app.db.session import get_database
from app.crud import template as template_crud
from app.crud import generated_post as post_crud
from app.services.image_service import generate_image_from_template
from app.api.post_generator.schemas import GeneratedPostCreate
from .schemas import TemplatePublic, TemplateGenerationResponse
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter()
CurrentUserDependency = Depends(get_current_active_user)
# --- FIX: Define the dependency type explicitly for clarity ---
DbDependency = Annotated[AsyncIOMotorDatabase, Depends(get_database)]
logger = logging.getLogger(__name__)


@router.get("", response_model=List[TemplatePublic])
async def list_available_templates(
    # --- FIX: Use the full Annotated type hint directly ---
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Get a list of all available templates for the user to choose from.
    """
    templates_from_db = await template_crud.get_all_templates(db)
    return templates_from_db

# --- THIS IS THE UPDATED ENDPOINT ---
# It no longer uses a Pydantic body model and instead accepts a dynamic request.
@router.post("/{template_id}/generate", response_model=TemplateGenerationResponse)
async def generate_post_from_template(
    template_id: str,
    request: Request, # Use the raw request to access form data
    # --- FIX: Use the full Annotated type hint directly ---
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Generate a new image post by filling in a template with user-provided text and image files.
    """
    try:
        template_obj_id = PyObjectId(template_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid template ID format.")

    template_doc = await template_crud.get_template_by_id(db, template_id=template_obj_id)
    if not template_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found.")
    
    # --- NEW: Process multipart/form-data ---
    form_data = await request.form()
    field_values: Dict[str, Any] = {}
    for key, value in form_data.items():
        field_values[key] = value

    try:
        # 1. Generate the image and get its URL. The service now handles both text and files.
        generated_url = generate_image_from_template(
            template_doc=template_doc,
            field_values=field_values,
            user_id=str(current_user.id)
        )
        
        # 2. Save the generated post to the database (logic remains the same)
        placeholder_request = {
            "product_name": template_doc.get("name", "Template Post"),
            "target_audience": "", "key_features": [], "tone": "",
            "platform": "", "call_to_action": "", "aspect_ratio": ""
        }
        post_to_save = GeneratedPostCreate(
            user_id=current_user.id,
            image_url=generated_url,
            prompt_used=f"Generated from template: {template_doc.get('name', 'Unknown Template')}",
            original_request=placeholder_request
        )
        await post_crud.create_generated_post(db, post_in=post_to_save)
        logger.info(f"Successfully saved template-generated post for user {current_user.id}")

        # 3. Return the response to the frontend
        return TemplateGenerationResponse(generated_image_url=generated_url)

    except ValueError as e:
        logger.error(f"Image generation failed for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail=f"Image generation failed: {e}")
    except Exception as e:
        logger.error(f"An unexpected error occurred for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred.")

