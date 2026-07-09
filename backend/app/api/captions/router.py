# D:/socialadify/backend/app/api/captions/router.py

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query, Path as FastApiPath
from fastapi.concurrency import run_in_threadpool
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Annotated, List, Optional
import os
import shutil
from pathlib import Path
import logging
import json # --- NEW: Import the json library ---
from bson import ObjectId 

# Gradio Client
from gradio_client import Client as GradioClient, handle_file as gradio_handle_file

# Gemini AI
import google.generativeai as genai

from app.schemas.user import UserInDB, PyObjectId
from app.core.security import get_current_active_user
from app.db.session import get_database
from .schemas import (
    CaptionPreferences, GeneratedCaptionResponse, ErrorResponse,
    CaptionCreate, CaptionPublic, CaptionSaveRequest, CaptionUpdate 
)
from app.crud import caption as caption_crud 

router = APIRouter()
logger = logging.getLogger(__name__)

# --- (Configuration and Dependencies remain the same) ---
HF_SPACE_ID = os.getenv("HF_SPACE_ID", "uzair-hassan003/SocialAdify") 
TEMP_IMAGE_DIR = Path("./temp_images")
TEMP_IMAGE_DIR.mkdir(parents=True, exist_ok=True) 
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

DbDependency = Annotated[AsyncIOMotorDatabase, Depends(get_database)]
CurrentUserDependency = Annotated[UserInDB, Depends(get_current_active_user)]


# --- (get_blip_image_description helper function remains the same) ---
def get_blip_image_description(image_path: Path) -> Optional[str]:
    # ... (no changes in this function)
    logger.info(f"Connecting to Hugging Face Space: {HF_SPACE_ID} for image description of {image_path}.")
    try:
        image_file_path_str = str(image_path.resolve())
        client = GradioClient(HF_SPACE_ID)
        logger.info(f"Sending image '{image_file_path_str}' to HF Space API (endpoint: /predict)...")
        blip_description_result = client.predict(image=gradio_handle_file(image_file_path_str), api_name="/predict")
        if isinstance(blip_description_result, str):
            description = blip_description_result.strip()
            if description: logger.info(f"BLIP Image Description received: \"{description}\""); return description
            else: logger.warning("BLIP description received is empty."); return None
        else:
            logger.warning(f"Received unexpected result type from BLIP: {type(blip_description_result)}")
            logger.warning(f"Full result from BLIP: {blip_description_result}"); return None
    except Exception as e:
        logger.error(f"An error occurred while getting BLIP description for {image_path}: {e}", exc_info=True); return None


# --- UPDATED: Gemini prompt now requests a structured JSON output ---
def construct_gemini_prompt_internal(image_desc: Optional[str], prefs: CaptionPreferences) -> str:
    prompt = "You are an expert social media caption writer.\nYour task is to generate three distinct and creative captions for a social media post based on the following information:\n\n"
    if image_desc: prompt += f"1.  **Image Description (from AI):** \"{image_desc}\"\n"
    else: prompt += "1.  **Image:** No description available.\n"
    
    prompt += f"2.  **Post Category:** \"{prefs.category}\"\n"
    prompt += f"3.  **Desired Tone/Style:** \"{prefs.tone}\"\n"
    
    if prefs.include_hashtags: prompt += "4. **Hashtags:** Include 3-5 relevant hashtags for each caption.\n"
    else: prompt += "4. **Hashtags:** Do not include any hashtags.\n"
    
    if prefs.include_emojis: prompt += "5. **Emojis:** Integrate relevant emojis naturally within each caption.\n"
    else: prompt += "5. **Emojis:** Do not include any emojis.\n\n"
    
    prompt += """
Based on all the above, generate three compelling and unique social media captions.

**Your response MUST be a single, valid JSON object with ONLY ONE key: "captions".**
The value of "captions" must be an array of exactly three strings. Each string is a complete caption.

Example format:
{
  "captions": [
    "Caption option one...",
    "Caption option two...",
    "Caption option three..."
  ]
}
"""
    return prompt

# --- UPDATED: Gemini function now parses the JSON response ---
async def generate_captions_with_gemini_async(prompt_text: str) -> List[str]:
    if not GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY environment variable not set.")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Caption generation service is not configured (API Key missing).")
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        # --- THE FIX: Configure the model to expect a JSON response ---
        model = genai.GenerativeModel(
            'gemini-2.0-flash',
            generation_config={"response_mime_type": "application/json"}
        )
        
        logger.info("Sending prompt to Gemini for multiple caption generation...")
        response = await model.generate_content_async(prompt_text)
        
        if not response.parts and response.prompt_feedback and response.prompt_feedback.block_reason:
            block_message = f"Caption generation blocked. Reason: {response.prompt_feedback.block_reason_message or response.prompt_feedback.block_reason}"
            logger.warning(block_message)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=block_message)

        # Parse the JSON response
        response_text = response.text.strip()
        if not response_text:
            logger.warning("Gemini returned empty text for captions.")
            return ["Could not generate captions at this time. Please try again."]

        captions_data = json.loads(response_text)
        generated_captions = captions_data.get("captions", [])

        if not generated_captions or not isinstance(generated_captions, list):
            logger.warning(f"Gemini did not return a valid list of captions. Response: {response_text}")
            return ["Failed to parse captions from AI. Please try again."]
        
        logger.info(f"Gemini generated {len(generated_captions)} captions.")
        return generated_captions

    except json.JSONDecodeError as e:
        logger.error(f"Failed to decode JSON from Gemini: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="AI returned an invalid format.")
    except Exception as e:
        logger.error(f"An error occurred while communicating with Gemini API: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error generating captions via Gemini: {str(e)}")


# --- (The rest of the file remains the same, no changes needed for the endpoints) ---
@router.post("/generate", response_model=GeneratedCaptionResponse)
async def generate_captions_endpoint(
    # ... (no changes in this function's signature or body)
    current_user: CurrentUserDependency, db: DbDependency, category: str = Form(...),
    tone: str = Form(...), include_hashtags: bool = Form(...), include_emojis: bool = Form(...),
    image_file: Optional[UploadFile] = File(None) 
):
    logger.info(f"Caption generation request for user: {current_user.email}")
    caption_prefs = CaptionPreferences(category=category, tone=tone, include_hashtags=include_hashtags, include_emojis=include_emojis)
    blip_description: Optional[str] = None; temp_image_path: Optional[Path] = None
    if image_file:
        if not image_file.content_type or not image_file.content_type.startswith("image/"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file type.")
        try:
            temp_image_path = TEMP_IMAGE_DIR / f"{current_user.id}_{image_file.filename}" 
            with open(temp_image_path, "wb") as buffer: shutil.copyfileobj(image_file.file, buffer)
            blip_description = await run_in_threadpool(get_blip_image_description, temp_image_path)
        except Exception as e: logger.error(f"Error processing image: {e}", exc_info=True); blip_description = None 
        finally:
            if temp_image_path and temp_image_path.exists():
                try: os.remove(temp_image_path)
                except Exception as e_del: logger.error(f"Error deleting temp image {temp_image_path}: {e_del}", exc_info=True)
    gemini_prompt = construct_gemini_prompt_internal(blip_description, caption_prefs)
    try: generated_captions_list = await generate_captions_with_gemini_async(gemini_prompt)
    except Exception as e: raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Caption generation failed: {str(e)}")
    if not generated_captions_list:
        generated_captions_list = ["Failed to generate a caption. Please try again."]
    return GeneratedCaptionResponse(captions=generated_captions_list, image_description_used=blip_description)

@router.post("/save", response_model=CaptionPublic, status_code=status.HTTP_201_CREATED)
async def save_caption_endpoint(
    caption_data: CaptionSaveRequest, current_user: CurrentUserDependency, db: DbDependency
):
    logger.info(f"Save caption request for user: {current_user.email}")
    caption_to_create = CaptionCreate(
        caption_text=caption_data.caption_text, preferences_category=caption_data.category,
        preferences_tone=caption_data.tone, preferences_include_hashtags=caption_data.include_hashtags,
        preferences_include_emojis=caption_data.include_emojis,
        original_image_description=caption_data.image_description_used,
        source_image_filename=caption_data.source_image_filename, is_edited=caption_data.is_edited,
        source="user_saved_ai_generated" if not caption_data.is_edited else "user_saved_edited_ai"
    )
    try:
        user_object_id = current_user.id 
        if not isinstance(user_object_id, ObjectId): user_object_id = ObjectId(str(user_object_id))
        
        saved_caption_in_db = await caption_crud.create_caption(db=db, user_id=user_object_id, caption_in=caption_to_create)
        
        # Manually construct the dictionary for CaptionPublic validation
        public_data = {
            "id": str(saved_caption_in_db.id), # Convert ObjectId to str
            "user_id": str(saved_caption_in_db.user_id), # Convert ObjectId to str
            "caption_text": saved_caption_in_db.caption_text,
            "preferences_category": saved_caption_in_db.preferences_category,
            "preferences_tone": saved_caption_in_db.preferences_tone,
            "preferences_include_hashtags": saved_caption_in_db.preferences_include_hashtags,
            "preferences_include_emojis": saved_caption_in_db.preferences_include_emojis,
            "original_image_description": saved_caption_in_db.original_image_description,
            "source_image_filename": saved_caption_in_db.source_image_filename,
            "is_edited": saved_caption_in_db.is_edited,
            "source": saved_caption_in_db.source,
            "created_at": saved_caption_in_db.created_at,
            "updated_at": saved_caption_in_db.updated_at
        }
        return CaptionPublic.model_validate(public_data)
    except Exception as e:
        logger.error(f"Failed to save caption for user {current_user.email}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not save caption.")

@router.get("/history", response_model=List[CaptionPublic])
async def get_user_caption_history(
    current_user: CurrentUserDependency, db: DbDependency,
    skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100)
):
    logger.info(f"Fetching caption history for user: {current_user.email}")
    try:
        user_object_id = current_user.id
        if not isinstance(user_object_id, ObjectId): user_object_id = ObjectId(str(user_object_id))
        
        captions_in_db = await caption_crud.get_captions_by_user_id(db=db, user_id=user_object_id, skip=skip, limit=limit)
        
        # Manually construct list of dictionaries for CaptionPublic validation
        response_list = []
        for caption_db in captions_in_db:
            public_data = {
                "id": str(caption_db.id), # Convert ObjectId to str
                "user_id": str(caption_db.user_id), # Convert ObjectId to str
                "caption_text": caption_db.caption_text,
                "preferences_category": caption_db.preferences_category,
                "preferences_tone": caption_db.preferences_tone,
                "preferences_include_hashtags": caption_db.preferences_include_hashtags,
                "preferences_include_emojis": caption_db.preferences_include_emojis,
                "original_image_description": caption_db.original_image_description,
                "source_image_filename": caption_db.source_image_filename,
                "is_edited": caption_db.is_edited,
                "source": caption_db.source,
                "created_at": caption_db.created_at,
                "updated_at": caption_db.updated_at
            }
            response_list.append(CaptionPublic.model_validate(public_data))
        return response_list
    except Exception as e:
        logger.error(f"Failed to fetch caption history for user {current_user.email}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not retrieve caption history.")

@router.put("/{caption_id}", response_model=CaptionPublic)
async def update_saved_caption_endpoint(
    caption_id: Annotated[str, FastApiPath(description="The ID of the caption to update")], 
    caption_update: CaptionUpdate, current_user: CurrentUserDependency, db: DbDependency
):
    logger.info(f"Update request for caption_id: {caption_id} by user: {current_user.email}")
    try:
        caption_object_id = PyObjectId(caption_id) 
        user_object_id = current_user.id
        if not isinstance(user_object_id, ObjectId): user_object_id = ObjectId(str(user_object_id))

        updated_caption_db = await caption_crud.update_caption(
            db=db, caption_id=caption_object_id, user_id=user_object_id, caption_update_data=caption_update
        )
        if not updated_caption_db:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Caption not found or you do not have permission to update it.")
        
        # Manually construct the dictionary for CaptionPublic validation
        public_data = {
            "id": str(updated_caption_db.id),
            "user_id": str(updated_caption_db.user_id),
            "caption_text": updated_caption_db.caption_text,
            "preferences_category": updated_caption_db.preferences_category,
            "preferences_tone": updated_caption_db.preferences_tone,
            "preferences_include_hashtags": updated_caption_db.preferences_include_hashtags,
            "preferences_include_emojis": updated_caption_db.preferences_include_emojis,
            "original_image_description": updated_caption_db.original_image_description,
            "source_image_filename": updated_caption_db.source_image_filename,
            "is_edited": updated_caption_db.is_edited,
            "source": updated_caption_db.source,
            "created_at": updated_caption_db.created_at,
            "updated_at": updated_caption_db.updated_at
        }
        return CaptionPublic.model_validate(public_data)
    except ValueError: 
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid caption ID format.")
    except Exception as e:
        logger.error(f"Failed to update caption {caption_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not update caption.")

@router.delete("/{caption_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_saved_caption_endpoint(
    caption_id: Annotated[str, FastApiPath(description="The ID of the caption to delete")],
    current_user: CurrentUserDependency, db: DbDependency
):
    logger.info(f"Delete request for caption_id: {caption_id} by user: {current_user.email}")
    try:
        caption_object_id = PyObjectId(caption_id) 
        user_object_id = current_user.id
        if not isinstance(user_object_id, ObjectId): user_object_id = ObjectId(str(user_object_id))

        success = await caption_crud.delete_caption(db=db, caption_id=caption_object_id, user_id=user_object_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Caption not found or you do not have permission to delete it.")
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid caption ID format.")
    except Exception as e:
        logger.error(f"Failed to delete caption {caption_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not delete caption.")

