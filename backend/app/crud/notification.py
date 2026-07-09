from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timezone
from typing import List
from app.api.notifications.schemas import NotificationCreate, NotificationResponse

async def create_notification(db: AsyncIOMotorDatabase, notification: NotificationCreate) -> NotificationResponse:
    """Save a new notification to MongoDB"""
    notification_dict = notification.model_dump()
    notification_dict["created_at"] = datetime.now(timezone.utc)
    notification_dict["is_read"] = False
    
    result = await db["notifications"].insert_one(notification_dict)
    
    created_notification = await db["notifications"].find_one({"_id": result.inserted_id})
    # Convert ObjectId to string for Pydantic
    created_notification["_id"] = str(created_notification["_id"])
    return NotificationResponse(**created_notification)

async def get_user_notifications(db: AsyncIOMotorDatabase, user_id: str, limit: int = 20) -> List[NotificationResponse]:
    """Get recent notifications for a specific user"""
    notifications = []
    cursor = db["notifications"].find({"user_id": user_id}).sort("created_at", -1).limit(limit)
    
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        notifications.append(NotificationResponse(**doc))
    
    return notifications

async def mark_notification_as_read(db: AsyncIOMotorDatabase, notification_id: str, user_id: str) -> bool:
    """Mark a notification as read"""
    try:
        result = await db["notifications"].update_one(
            {"_id": ObjectId(notification_id), "user_id": user_id},
            {"$set": {"is_read": True}}
        )
        return result.modified_count > 0
    except Exception:
        return False

async def mark_all_as_read(db: AsyncIOMotorDatabase, user_id: str) -> int:
    """Mark all notifications for a user as read"""
    result = await db["notifications"].update_many(
        {"user_id": user_id, "is_read": False},
        {"$set": {"is_read": True}}
    )
    return result.modified_count