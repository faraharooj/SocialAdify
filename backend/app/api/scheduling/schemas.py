# D:/socialadify/backend/app/api/scheduling/schemas.py
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from app.schemas.user import PyObjectId

# --- NEW SCHEMAS FOR AI SUGGESTION ---
class AISuggestionRequest(BaseModel):
    caption: str = Field(..., min_length=1, description="The content of the post/ad.")
    target_platform: str = Field(..., min_length=1, description="The platform (e.g., 'Facebook', 'Instagram').")
    is_boosted: bool = Field(..., description="True if the post will be a boosted ad, False for organic.")

class AISuggestionResponse(BaseModel):
    suggested_time_utc: str = Field(..., description="The suggested optimal time in UTC ISO format.")
    reasoning: Optional[str] = Field(None, description="The AI's reasoning for the suggestion.")
    # We can add more fields later, like the reasoning from the AI
    # reasoning: Optional[str] = None

class ScheduledPostBase(BaseModel):
    caption: str
    target_platform: Optional[str] = None
    auto_post: bool = False
    auto_boost: bool = False
    boost_budget: Optional[float] = None
    boost_duration_days: Optional[int] = None

class ScheduledPostCreate(ScheduledPostBase):
    scheduled_at_str: str

class ScheduledPostUpdate(BaseModel):
    caption: Optional[str] = None
    scheduled_at_str: Optional[str] = None
    target_platform: Optional[str] = None
    auto_post: Optional[bool] = None
    auto_boost: Optional[bool] = None
    boost_budget: Optional[float] = None
    boost_duration_days: Optional[int] = None

class ScheduledPostInDB(ScheduledPostBase):
    id: PyObjectId = Field(alias="_id")
    user_id: PyObjectId
    image_url: str
    scheduled_at: datetime
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={
            # --- THIS IS THE DEFINITIVE FIX ---
            # This lambda function ensures that the datetime object is converted
            # to an ISO format string that explicitly includes the UTC timezone
            # indicator ('Z'), which JavaScript can parse correctly.
            datetime: lambda dt: dt.isoformat().replace('+00:00', 'Z'),
            PyObjectId: str,
        }
    )

class ScheduledPostPublic(ScheduledPostInDB):
    id: str
    user_id: str

# --- NEW SCHEMAS FOR CALENDAR STATUS ---

class CalendarDayStatus(BaseModel):
    """Represents the aggregated status for a single day on the calendar."""
    date: str = Field(..., description="Date in YYYY-MM-DD format.")
    status: str = Field(..., description="Aggregated status: 'scheduled', 'failed', 'completed', 'uploaded'.")
    count: int = Field(..., description="Number of posts on this date with the given status.")

class CalendarStatusResponse(BaseModel):
    """The full response for the calendar endpoint."""
    statuses: List[CalendarDayStatus] = Field(..., description="List of post statuses aggregated by day.")