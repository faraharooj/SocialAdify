# D:\socialadify\backend\app\api\notification\schemas.py

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class NotificationBase(BaseModel):
    message: str
    type: str = "info" # 'info', 'success', 'error'
    is_read: bool = False
    related_post_id: Optional[str] = None

class NotificationCreate(NotificationBase):
    user_id: str # We need to know who to notify

class NotificationResponse(NotificationBase):
    id: str = Field(..., alias="_id")
    created_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda dt: dt.isoformat()}