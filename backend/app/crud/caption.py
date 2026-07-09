# D:\socialadify\backend\app\crud\caption.py
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorCollection
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import logging

from app.api.captions.schemas import CaptionCreate, CaptionInDB, CaptionUpdate 

CAPTIONS_COLLECTION = "captions"
logger = logging.getLogger(__name__)

async def create_caption(db: AsyncIOMotorDatabase, user_id: ObjectId, caption_in: CaptionCreate) -> CaptionInDB:
    # ... (existing code)
    logger.info(f"Attempting to save caption for user_id: {user_id}")
    captions_collection: AsyncIOMotorCollection = db[CAPTIONS_COLLECTION]
    caption_data = caption_in.model_dump(exclude_unset=True)
    caption_data["user_id"] = user_id
    caption_data["created_at"] = datetime.utcnow()
    caption_data["updated_at"] = datetime.utcnow()
    result = await captions_collection.insert_one(caption_data)
    created_caption_data = await captions_collection.find_one({"_id": result.inserted_id})
    if not created_caption_data:
        logger.error(f"Could not retrieve caption for user_id {user_id} after insertion.")
        raise Exception("Failed to save caption: Could not retrieve after insertion.")
    logger.info(f"Caption saved successfully with id: {created_caption_data['_id']} for user_id: {user_id}")
    return CaptionInDB(**created_caption_data)

async def get_captions_by_user_id(db: AsyncIOMotorDatabase, user_id: ObjectId, skip: int = 0, limit: int = 100) -> List[CaptionInDB]:
    # ... (existing code)
    logger.info(f"Fetching captions for user_id: {user_id}, skip: {skip}, limit: {limit}")
    captions_collection: AsyncIOMotorCollection = db[CAPTIONS_COLLECTION]
    captions_cursor = captions_collection.find({"user_id": user_id}).sort("created_at", -1).skip(skip).limit(limit)
    captions_list = await captions_cursor.to_list(length=limit)
    logger.info(f"Found {len(captions_list)} captions for user_id: {user_id}")
    return [CaptionInDB(**caption_data) for caption_data in captions_list]

async def get_caption_by_id_for_user(db: AsyncIOMotorDatabase, caption_id: ObjectId, user_id: ObjectId) -> Optional[CaptionInDB]:
    # ... (existing code)
    logger.info(f"Fetching caption by id: {caption_id} for user_id: {user_id}")
    captions_collection: AsyncIOMotorCollection = db[CAPTIONS_COLLECTION]
    caption_data = await captions_collection.find_one({"_id": caption_id, "user_id": user_id})
    if caption_data:
        return CaptionInDB(**caption_data)
    logger.warning(f"Caption not found or user mismatch: caption_id {caption_id}, user_id {user_id}")
    return None

async def update_caption(db: AsyncIOMotorDatabase, caption_id: ObjectId, user_id: ObjectId, caption_update_data: CaptionUpdate) -> Optional[CaptionInDB]:
    # ... (existing code)
    logger.info(f"Attempting to update caption_id: {caption_id}, user_id: {user_id}")
    captions_collection: AsyncIOMotorCollection = db[CAPTIONS_COLLECTION]
    update_fields = caption_update_data.model_dump(exclude_unset=True)
    if not update_fields:
        logger.info("No fields to update for caption_id: {caption_id}")
        return await get_caption_by_id_for_user(db, caption_id, user_id) 
    update_fields["updated_at"] = datetime.utcnow()
    update_fields["is_edited"] = True 
    update_result = await captions_collection.update_one(
        {"_id": caption_id, "user_id": user_id},
        {"$set": update_fields}
    )
    if update_result.matched_count == 0:
        logger.warning(f"Caption not found or user mismatch for update: caption_id {caption_id}, user_id {user_id}")
        return None
    updated_caption_data = await captions_collection.find_one({"_id": caption_id, "user_id": user_id})
    if updated_caption_data:
        logger.info(f"Caption updated successfully for caption_id: {caption_id}")
        return CaptionInDB(**updated_caption_data)
    logger.error(f"Failed to retrieve caption after update for caption_id: {caption_id}")
    return None 

async def delete_caption(db: AsyncIOMotorDatabase, caption_id: ObjectId, user_id: ObjectId) -> bool: 
    # ... (existing code)
    logger.info(f"Attempting to delete caption_id: {caption_id} for user_id: {user_id}")
    captions_collection: AsyncIOMotorCollection = db[CAPTIONS_COLLECTION]
    delete_result = await captions_collection.delete_one({"_id": caption_id, "user_id": user_id})
    if delete_result.deleted_count == 1:
        logger.info(f"Caption deleted successfully: caption_id {caption_id}")
        return True
    logger.warning(f"Caption not found or user mismatch for deletion: caption_id {caption_id}, user_id {user_id}")
    return False

# --- New CRUD function to delete all captions for a user ---
async def delete_captions_by_user_id(db: AsyncIOMotorDatabase, user_id: ObjectId) -> int:
    """
    Deletes all captions associated with a given user_id.
    Returns the number of captions deleted.
    """
    logger.info(f"Attempting to delete all captions for user_id: {user_id}")
    captions_collection: AsyncIOMotorCollection = db[CAPTIONS_COLLECTION]
    delete_result = await captions_collection.delete_many({"user_id": user_id})
    deleted_count = delete_result.deleted_count
    logger.info(f"Deleted {deleted_count} captions for user_id: {user_id}")
    return deleted_count

