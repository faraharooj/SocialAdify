# D:/socialadify/backend/app/crud/scheduled_post.py

from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorCollection
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
import logging

from app.api.scheduling.schemas import ScheduledPostCreate, ScheduledPostInDB, ScheduledPostUpdate 

SCHEDULED_POSTS_COLLECTION = "scheduled_posts"
logger = logging.getLogger(__name__)

async def create_scheduled_post(
    db: AsyncIOMotorDatabase, 
    user_id: ObjectId, 
    image_url: str,
    post_create_data: ScheduledPostCreate
) -> ScheduledPostInDB:
    logger.info(f"Attempting to schedule post for user_id: {user_id}")
    collection: AsyncIOMotorCollection = db[SCHEDULED_POSTS_COLLECTION]
    
    try:
        # --- THIS IS THE FIX ---
        # The 'Z' at the end of the ISO string from the frontend means UTC.
        # We replace 'Z' with '+00:00' which fromisoformat understands as a timezone.
        # This creates a timezone-AWARE datetime object, which is what we need.
        scheduled_at_dt = datetime.fromisoformat(post_create_data.scheduled_at_str.replace('Z', '+00:00'))
    except ValueError:
        logger.error(f"Invalid datetime format: {post_create_data.scheduled_at_str}")
        raise ValueError("Invalid scheduled_at format. Please use ISO format (YYYY-MM-DDTHH:MM:SSZ).")

    post_doc = {
        "user_id": user_id,
        "image_url": image_url,
        "caption": post_create_data.caption,
        "scheduled_at": scheduled_at_dt, # This is now a timezone-aware object
        "target_platform": post_create_data.target_platform,
        "status": "scheduled",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "auto_post": post_create_data.auto_post,
        "auto_boost": post_create_data.auto_boost,
        "boost_budget": post_create_data.boost_budget,
        "boost_duration_days": post_create_data.boost_duration_days,
    }
    
    result = await collection.insert_one(post_doc)
    created_post_data = await collection.find_one({"_id": result.inserted_id})
    
    if not created_post_data:
        raise Exception("Failed to schedule post: Could not retrieve after insertion.")
        
    return ScheduledPostInDB(**created_post_data)

async def update_scheduled_post(
    db: AsyncIOMotorDatabase, 
    post_id: ObjectId, 
    user_id: ObjectId, 
    update_data: ScheduledPostUpdate
) -> Optional[ScheduledPostInDB]:
    logger.info(f"Attempting to update scheduled post_id: {post_id} for user_id: {user_id}")
    collection: AsyncIOMotorCollection = db[SCHEDULED_POSTS_COLLECTION]
    
    current_post = await collection.find_one({"_id": post_id, "user_id": user_id})
    if not current_post:
        return None

    update_fields: Dict[str, Any] = {}
    update_dict = update_data.model_dump(exclude_unset=True)

    if "caption" in update_dict:
        update_fields["caption"] = update_dict["caption"]
    if "scheduled_at_str" in update_dict:
        try:
            # --- THIS IS THE FIX ---
            # Apply the same timezone-aware parsing here
            update_fields["scheduled_at"] = datetime.fromisoformat(update_dict["scheduled_at_str"].replace('Z', '+00:00'))
        except ValueError:
            raise ValueError("Invalid scheduled_at format for update. Please use ISO format.")
    if "target_platform" in update_dict:
        update_fields["target_platform"] = update_dict["target_platform"]
    # ... (other fields) ...

    if not update_fields:
        return ScheduledPostInDB(**current_post)

    update_fields["updated_at"] = datetime.now(timezone.utc)
    
    await collection.update_one(
        {"_id": post_id, "user_id": user_id},
        {"$set": update_fields}
    )
    
    updated_post_data = await collection.find_one({"_id": post_id, "user_id": user_id})
    if updated_post_data:
        return ScheduledPostInDB(**updated_post_data)
    
    return None 

# --- (Other functions remain the same as they were already correct) ---
async def get_scheduled_posts_by_user(
    db: AsyncIOMotorDatabase, 
    user_id: ObjectId, 
    skip: int = 0, 
    limit: int = 100
) -> List[ScheduledPostInDB]:
    collection: AsyncIOMotorCollection = db[SCHEDULED_POSTS_COLLECTION]
    cursor = collection.find({"user_id": user_id}).sort([("scheduled_at", 1), ("created_at", -1)]).skip(skip).limit(limit)
    posts_list = await cursor.to_list(length=limit)
    return [ScheduledPostInDB(**post_data) for post_data in posts_list]

async def get_scheduled_post_by_id_for_user(
    db: AsyncIOMotorDatabase, 
    post_id: ObjectId, 
    user_id: ObjectId
) -> Optional[ScheduledPostInDB]:
    collection: AsyncIOMotorCollection = db[SCHEDULED_POSTS_COLLECTION]
    post_data = await collection.find_one({"_id": post_id, "user_id": user_id})
    if post_data:
        return ScheduledPostInDB(**post_data)
    return None

async def delete_scheduled_post(
    db: AsyncIOMotorDatabase, 
    post_id: ObjectId, 
    user_id: ObjectId
) -> bool:
    collection: AsyncIOMotorCollection = db[SCHEDULED_POSTS_COLLECTION]
    delete_result = await collection.delete_one({"_id": post_id, "user_id": user_id})
    return delete_result.deleted_count == 1

async def get_due_posts(db: AsyncIOMotorDatabase) -> List[ScheduledPostInDB]:
    collection: AsyncIOMotorCollection = db[SCHEDULED_POSTS_COLLECTION]
    now_utc = datetime.now(timezone.utc)
    due_posts_cursor = collection.find({
        "status": "scheduled",
        "scheduled_at": {"$lte": now_utc}
    })
    due_posts = await due_posts_cursor.to_list(length=None)
    logger.info(f"Found {len(due_posts)} due posts to process.")
    return [ScheduledPostInDB(**post) for post in due_posts]

async def update_post_status(db: AsyncIOMotorDatabase, post_id: ObjectId, new_status: str, error_message: Optional[str] = None) -> bool:
    collection: AsyncIOMotorCollection = db[SCHEDULED_POSTS_COLLECTION]
    update_fields = {
        "status": new_status,
        "updated_at": datetime.now(timezone.utc)
    }
    if error_message:
        update_fields["error_message"] = error_message
    result = await collection.update_one(
        {"_id": post_id},
        {"$set": update_fields}
    )
    return result.modified_count == 1



#thiss is forr the calender attt main dashboardd
async def get_monthly_post_status(
    db: AsyncIOMotorDatabase, 
    user_id: ObjectId, 
    year: int, 
    month: int
) -> List[Dict[str, Any]]:
    """
    Retrieves the aggregated post status (count and dominant status) for each day
    within a specified month and year for a specific user using MongoDB aggregation.
    
    The dominant status is determined by priority: failed > scheduled > completed > uploaded.
    """
    collection: AsyncIOMotorCollection = db[SCHEDULED_POSTS_COLLECTION]
    
    # Calculate the start and end dates for the given month (UTC)
    start_date = datetime(year, month, 1, 0, 0, 0, tzinfo=timezone.utc)
    # The next month's 1st day gives us a clean exclusive upper boundary
    end_month = month + 1
    end_year = year
    if end_month > 12:
        end_month = 1
        end_year += 1
    end_date = datetime(end_year, end_month, 1, 0, 0, 0, tzinfo=timezone.utc)

    # Status Priority Map (for use in $switch)
    # Higher number means higher priority for calendar display (e.g., Failed is most important)
    STATUS_PRIORITY: Dict[str, int] = {
        "failed": 4,
        "scheduled": 3,
        "completed": 1,
    }

    # MongoDB Aggregation Pipeline
    pipeline = [
        # 1. Filter posts for the user and the date range
        {
            "$match": {
                "user_id": user_id,
                "scheduled_at": {"$gte": start_date, "$lt": end_date},
                # Exclude statuses that shouldn't appear on the calendar if any (e.g., 'draft')
                "status": {"$in": ["scheduled", "failed", "completed"]}
            }
        },
        
        # 2. Group by the day (YYYY-MM-DD) and calculate min/max/count
        {
            "$group": {
                "_id": {
                    "day": {"$dayOfMonth": "$scheduled_at"},
                    "month": {"$month": "$scheduled_at"},
                    "year": {"$year": "$scheduled_at"}
                },
                "posts": {"$push": {"status": "$status"}}, # Collect all statuses for the day
                "count": {"$sum": 1} # Total number of posts for that day
            }
        },
        
        # 3. Determine the final dominant status for the day
        {
            "$addFields": {
                "max_priority": {
                    "$max": {
                        "$map": {
                            "input": "$posts",
                            "as": "post",
                            "in": {
                                # Use $switch to convert status string to its priority number
                                "$switch": {
                                    "branches": [
                                        {"case": {"$eq": ["$$post.status", "failed"]}, "then": STATUS_PRIORITY['failed']},
                                        {"case": {"$eq": ["$$post.status", "scheduled"]}, "then": STATUS_PRIORITY['scheduled']},
                                        {"case": {"$eq": ["$$post.status", "completed"]}, "then": STATUS_PRIORITY['completed']},
                                    ],
                                    "default": 0 # Default low priority
                                }
                            }
                        }
                    }
                }
            }
        },
        
        # 4. Convert the max priority back into the dominant status string
        {
            "$addFields": {
                "dominant_status": {
                    "$switch": {
                        "branches": [
                            {"case": {"$eq": ["$max_priority", STATUS_PRIORITY['failed']]}, "then": "failed"},
                            {"case": {"$eq": ["$max_priority", STATUS_PRIORITY['scheduled']]}, "then": "scheduled"},
                            {"case": {"$eq": ["$max_priority", STATUS_PRIORITY['completed']]}, "then": "completed"},
                        ],
                        "default": "completed"
                    }
                }
            }
        },
        
        # 5. Project the final result into the required frontend format (date: YYYY-MM-DD, status, count)
       {
    "$project": {
        "_id": 0,
        "date": {
            # Use $dateToString on a reconstructed date to format YYYY-MM-DD reliably.
            # We must create a new date using the $dateFromParts operator.
            "$dateToString": {
                "format": "%Y-%m-%d",
                "date": {
                    "$dateFromParts": {
                        "year": "$_id.year",
                        "month": "$_id.month",
                        "day": "$_id.day"
                    }
                }
            }
        },
        "status": "$dominant_status",
        "count": "$count"
    }
}
    ]

    # Execute the aggregation pipeline
    result_cursor = collection.aggregate(pipeline)
    return await result_cursor.to_list(length=None)