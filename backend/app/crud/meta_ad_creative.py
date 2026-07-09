# D:/socialadify/backend/app/crud/meta_ad_creative.py

from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorCollection
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
import logging

# --- Import the new Meta schemas ---
from app.api.ads.meta_schemas import (
    MetaAdCreativeInDB, MetaAdCreativePayload, MetaAdCreativeUpdate
)

META_AD_CREATIVES_COLLECTION = "meta_ad_creatives"
logger = logging.getLogger(__name__)

async def create_meta_ad_creative(
    db: AsyncIOMotorDatabase, 
    user_id: ObjectId, 
    ad_data: MetaAdCreativePayload,
    image_url: Optional[str] # Single image, like the scheduler
) -> MetaAdCreativeInDB:
    """
    Creates a new Meta ad creative draft in the database.
    """
    logger.info(f"Creating Meta ad creative draft for user_id: {user_id}")
    collection: AsyncIOMotorCollection = db[META_AD_CREATIVES_COLLECTION]
    
    ad_doc = {
        "user_id": user_id,
        "campaign_name": ad_data.campaign_name,
        "ad_goal": ad_data.ad_goal,
        "platform": ad_data.platform,
        "budget": ad_data.budget,
        "primary_text": ad_data.primary_text,
        "headline": ad_data.headline,
        "website_url": ad_data.website_url,
        "call_to_action": ad_data.call_to_action,
        "image_url": image_url,
        
        "status": "DRAFT",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "error_message": None,
    }
    
    try:
        result = await collection.insert_one(ad_doc)
        created_ad_data = await collection.find_one({"_id": result.inserted_id})
        
        if not created_ad_data:
            logger.error(f"Failed to create Meta ad creative for user {user_id}: Could not retrieve after insertion.")
            raise Exception("Failed to create Meta ad creative: Could not retrieve after insertion.")
            
        return MetaAdCreativeInDB(**created_ad_data)
        
    except Exception as e:
        logger.error(f"Error creating Meta ad creative for user {user_id}: {e}", exc_info=True)
        raise

async def get_meta_ad_creative_by_id(
    db: AsyncIOMotorDatabase, 
    ad_id: ObjectId, 
    user_id: ObjectId
) -> Optional[MetaAdCreativeInDB]:
    """
    Fetches a single Meta ad creative by its ID, ensuring it belongs to the user.
    """
    collection: AsyncIOMotorCollection = db[META_AD_CREATIVES_COLLECTION]
    ad_data = await collection.find_one({"_id": ad_id, "user_id": user_id})
    if ad_data:
        return MetaAdCreativeInDB(**ad_data)
    return None

async def get_all_meta_ad_creatives_by_user(
    db: AsyncIOMotorDatabase, 
    user_id: ObjectId, 
    skip: int = 0, 
    limit: int = 100
) -> List[MetaAdCreativeInDB]:
    """
    Fetches all Meta ad creatives for a specific user, with pagination.
    """
    collection: AsyncIOMotorCollection = db[META_AD_CREATIVES_COLLECTION]
    cursor = collection.find({"user_id": user_id}).sort("created_at", -1).skip(skip).limit(limit)
    ads_list = await cursor.to_list(length=limit)
    return [MetaAdCreativeInDB(**ad_data) for ad_data in ads_list]

async def update_meta_ad_creative(
    db: AsyncIOMotorDatabase, 
    ad_id: ObjectId, 
    user_id: ObjectId, 
    update_data: MetaAdCreativeUpdate
) -> Optional[MetaAdCreativeInDB]:
    """
    Updates an existing Meta ad creative draft.
    """
    logger.info(f"Attempting to update Meta ad_id: {ad_id} for user_id: {user_id}")
    collection: AsyncIOMotorCollection = db[META_AD_CREATIVES_COLLECTION]
    
    current_ad = await collection.find_one({"_id": ad_id, "user_id": user_id})
    if not current_ad:
        logger.warning(f"Meta Ad creative {ad_id} not found for user {user_id} during update.")
        return None

    update_fields: Dict[str, Any] = update_data.model_dump(exclude_unset=True)

    if not update_fields:
        logger.info(f"No fields to update for Meta ad {ad_id}.")
        return MetaAdCreativeInDB(**current_ad)

    update_fields["updated_at"] = datetime.now(timezone.utc)
    
    await collection.update_one(
        {"_id": ad_id, "user_id": user_id},
        {"$set": update_fields}
    )
    
    updated_ad_data = await collection.find_one({"_id": ad_id, "user_id": user_id})
    if updated_ad_data:
        return MetaAdCreativeInDB(**updated_ad_data)
    
    return None

async def delete_meta_ad_creative(
    db: AsyncIOMotorDatabase, 
    ad_id: ObjectId, 
    user_id: ObjectId
) -> bool:
    """
    Deletes a Meta ad creative draft.
    """
    collection: AsyncIOMotorCollection = db[META_AD_CREATIVES_COLLECTION]
    delete_result = await collection.delete_one({"_id": ad_id, "user_id": user_id})
    return delete_result.deleted_count == 1

async def update_meta_ad_creative_status(
    db: AsyncIOMotorDatabase, 
    ad_id: ObjectId, 
    new_status: str, 
    error_message: Optional[str] = None
) -> bool:
    """
    Updates the status of a Meta ad (e.g., to PUBLISHED or FAILED).
    """
    collection: AsyncIOMotorCollection = db[META_AD_CREATIVES_COLLECTION]
    update_fields = {
        "status": new_status,
        "updated_at": datetime.now(timezone.utc)
    }
    if error_message:
        update_fields["error_message"] = error_message
        
    result = await collection.update_one(
        {"_id": ad_id},
        {"$set": update_fields}
    )
    return result.modified_count == 1