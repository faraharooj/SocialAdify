# D:\socialadify\backend\app\crud\ad_creative.py
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorCollection
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
import logging

# --- THIS IS THE CORRECTED IMPORT ---
# We now import AdCreativePayload instead of AdCreativeCreate
from app.api.ads.schemas import (
    AdCreativeInDB, AdCreativePayload, AdCreativeUpdate
)
# ---

AD_CREATIVES_COLLECTION = "ad_creatives"
logger = logging.getLogger(__name__)

async def create_ad_creative(
    db: AsyncIOMotorDatabase, 
    user_id: ObjectId, 
    ad_data: AdCreativePayload,
    # --- UPDATED: Accept two image URLs ---
    image_url_square: Optional[str],
    image_url_landscape: Optional[str]
) -> AdCreativeInDB:
    """
    Creates a new ad creative draft in the database.
    """
    logger.info(f"Creating ad creative draft for user_id: {user_id}")
    collection: AsyncIOMotorCollection = db[AD_CREATIVES_COLLECTION]
    
    
    ad_doc = {
        "user_id": user_id,
        "campaign_name": ad_data.campaign_name,
        "ad_goal": ad_data.ad_goal,
        "platform": ad_data.platform,
        "budget": ad_data.budget,
        "final_url": ad_data.final_url,
        "business_name": ad_data.business_name,
        "call_to_action_text": ad_data.call_to_action_text,
        "headlines": ad_data.headlines,
        "long_headline": ad_data.long_headline,
        "descriptions": ad_data.descriptions,
        
        # Image URLs
        "image_url_square": image_url_square,
        "image_url_landscape": image_url_landscape,
        
        # --- 'audience' field removed ---
        
        "status": "DRAFT",  # Always start as DRAFT
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "error_message": None,
    }
    
    try:
        result = await collection.insert_one(ad_doc)
        created_ad_data = await collection.find_one({"_id": result.inserted_id})
        
        if not created_ad_data:
            logger.error(f"Failed to create ad creative for user {user_id}: Could not retrieve after insertion.")
            raise Exception("Failed to create ad creative: Could not retrieve after insertion.")
            
        return AdCreativeInDB(**created_ad_data)
        
    except Exception as e:
        logger.error(f"Error creating ad creative for user {user_id}: {e}", exc_info=True)
        raise

async def get_ad_creative_by_id(
    db: AsyncIOMotorDatabase, 
    ad_id: ObjectId, 
    user_id: ObjectId
) -> Optional[AdCreativeInDB]:
    """
    Fetches a single ad creative by its ID, ensuring it belongs to the user.
    """
    collection: AsyncIOMotorCollection = db[AD_CREATIVES_COLLECTION]
    ad_data = await collection.find_one({"_id": ad_id, "user_id": user_id})
    if ad_data:
        return AdCreativeInDB(**ad_data)
    return None

async def get_all_ad_creatives_by_user(
    db: AsyncIOMotorDatabase, 
    user_id: ObjectId, 
    skip: int = 0, 
    limit: int = 100
) -> List[AdCreativeInDB]:
    """
    Fetches all ad creatives for a specific user, with pagination.
    """
    collection: AsyncIOMotorCollection = db[AD_CREATIVES_COLLECTION]
    cursor = collection.find({"user_id": user_id}).sort("created_at", -1).skip(skip).limit(limit)
    ads_list = await cursor.to_list(length=limit)
    return [AdCreativeInDB(**ad_data) for ad_data in ads_list]

async def update_ad_creative(
    db: AsyncIOMotorDatabase, 
    ad_id: ObjectId, 
    user_id: ObjectId, 
    update_data: AdCreativeUpdate
) -> Optional[AdCreativeInDB]:
    """
    Updates an existing ad creative draft.
    """
    logger.info(f"Attempting to update ad_id: {ad_id} for user_id: {user_id}")
    collection: AsyncIOMotorCollection = db[AD_CREATIVES_COLLECTION]
    
    current_ad = await collection.find_one({"_id": ad_id, "user_id": user_id})
    if not current_ad:
        logger.warning(f"Ad creative {ad_id} not found for user {user_id} during update.")
        return None

    # Only update fields that are explicitly set in the update_data
    update_fields: Dict[str, Any] = update_data.model_dump(exclude_unset=True)
    
    # Handle nested audience update
    if "audience" in update_fields and update_data.audience is not None:
        # We replace the whole audience sub-document
        update_fields["audience"] = update_data.audience.model_dump()
        
    # --- UPDATED: Check for new image URL fields ---
    if "image_url_square" in update_fields:
        update_fields["image_url_square"] = str(update_data.image_url_square) if update_data.image_url_square else None
    
    if "image_url_landscape" in update_fields:
        update_fields["image_url_landscape"] = str(update_data.image_url_landscape) if update_data.image_url_landscape else None
    # ---

    if not update_fields:
        logger.info(f"No fields to update for ad {ad_id}.")
        return AdCreativeInDB(**current_ad)

    update_fields["updated_at"] = datetime.now(timezone.utc)
    
    await collection.update_one(
        {"_id": ad_id, "user_id": user_id},
        {"$set": update_fields}
    )
    
    updated_ad_data = await collection.find_one({"_id": ad_id, "user_id": user_id})
    if updated_ad_data:
        return AdCreativeInDB(**updated_ad_data)
    
    return None

async def delete_ad_creative(
    db: AsyncIOMotorDatabase, 
    ad_id: ObjectId, 
    user_id: ObjectId
) -> bool:
    """
    Deletes an ad creative, e.g., a draft.
    """
    collection: AsyncIOMotorCollection = db[AD_CREATIVES_COLLECTION]
    delete_result = await collection.delete_one({"_id": ad_id, "user_id": user_id})
    return delete_result.deleted_count == 1

async def update_ad_creative_status(
    db: AsyncIOMotorDatabase, 
    ad_id: ObjectId, 
    new_status: str, 
    error_message: Optional[str] = None
) -> bool:
    """
    Updates the status of an ad (e.g., to PUBLISHED or FAILED).
    """
    collection: AsyncIOMotorCollection = db[AD_CREATIVES_COLLECTION]
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

