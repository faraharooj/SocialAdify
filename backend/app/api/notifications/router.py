# D:\socialadify\backend\app\api\notifications\router.py

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Annotated
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.session import get_database
from app.core.security import get_current_active_user
from app.schemas.user import UserInDB
from app.api.notifications.schemas import NotificationResponse
from app.crud import notification as notification_crud

router = APIRouter()

CurrentUserDependency = Annotated[UserInDB, Depends(get_current_active_user)]
DbDependency = Annotated[AsyncIOMotorDatabase, Depends(get_database)]

@router.get("/", response_model=List[NotificationResponse])
async def get_my_notifications(
    current_user: CurrentUserDependency,
    db: DbDependency
):
    """Fetch recent notifications for the logged-in user"""
    return await notification_crud.get_user_notifications(db, str(current_user.id))

@router.put("/{notification_id}/read")
async def read_notification(
    notification_id: str,
    current_user: CurrentUserDependency,
    db: DbDependency
):
    """Mark specific notification as read"""
    success = await notification_crud.mark_notification_as_read(db, notification_id, str(current_user.id))
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "success"}

@router.put("/read-all")
async def read_all_notifications(
    current_user: CurrentUserDependency,
    db: DbDependency
):
    """Mark all notifications as read"""
    count = await notification_crud.mark_all_as_read(db, str(current_user.id))
    return {"status": "success", "updated_count": count}