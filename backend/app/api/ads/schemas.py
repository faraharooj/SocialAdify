# D:\socialadify\backend\app\api\ads\schemas.py
from pydantic import BaseModel, Field, HttpUrl, ConfigDict, BeforeValidator
from typing import Optional, List, Annotated
from datetime import datetime
from bson import ObjectId

# --- ObjectId Helper Class ---
# This is the Pydantic v2 compatible class
def validate_object_id(v):
    if not ObjectId.is_valid(v):
        raise ValueError("Invalid ObjectId")
    return v

PyObjectId = Annotated[ObjectId, BeforeValidator(validate_object_id)]

# --- Base Schemas ---

# --- GoogleAudienceSchema Removed ---

class AdCreativeBase(BaseModel):
    campaign_name: str = Field(..., example="Fall Sale 2025")
    ad_goal: str = Field(..., example="TRAFFIC") # e.g., "TRAFFIC", "AWARENESS", "LEADS"
    platform: str = Field(..., example="GOOGLE")

    # --- MODIFIED: Made budget optional here to load old drafts ---
    budget: Optional[float] = Field(default=None, example=1000.0, description="Daily budget in local currency (e.g., PKR)")
    # ---

    # --- UPDATED: New required ad fields ---
    final_url: str = Field(..., example="https://www.socialadify.com")
    business_name: str = Field(..., example="SocialAdify")
    call_to_action_text: str = Field(..., example="LEARN_MORE")
    
    headlines: List[str] = Field(..., min_length=1, max_length=5, example=["Headline 1", "Headline 2"])
    long_headline: str = Field(..., example="This is the Long Headline (up to 90 chars)")
    descriptions: List[str] = Field(..., min_length=1, max_length=5, example=["Description 1", "Description 2"])
    # ---

    # --- Image URLs ---
    image_url_square: Optional[str] = Field(default=None, example="/static/ad_creative_images/image_1x1.png")
    image_url_landscape: Optional[str] = Field(default=None, example="/static/ad_creative_images/image_1.91x1.png")
    # ---
    
    # --- 'audience' field Removed ---

# --- API Schemas ---

class AdCreativePayload(AdCreativeBase):
    # --- MODIFIED: Override budget to be REQUIRED for new drafts ---
    budget: float = Field(..., example=1000.0, description="Daily budget in local currency (e.g., PKR)")
    pass

class AdCreativeUpdate(BaseModel):
    campaign_name: Optional[str] = None
    ad_goal: Optional[str] = None
    
    # --- MODIFIED: Added optional budget for updates ---
    budget: Optional[float] = None
    # ---
    
    # --- UPDATED: New ad fields ---
    final_url: Optional[str] = None
    business_name: Optional[str] = None
    call_to_action_text: Optional[str] = None
    headlines: Optional[List[str]] = None
    long_headline: Optional[str] = None
    descriptions: Optional[List[str]] = None
    # ---

    image_url_square: Optional[str] = None
    image_url_landscape: Optional[str] = None
    
    # --- 'audience' field Removed ---

# --- Database Model (for internal use) ---
class AdCreativeInDB(AdCreativeBase):
    model_config = ConfigDict(arbitrary_types_allowed=True, json_encoders={ObjectId: str})
    
    id: PyObjectId = Field(alias="_id")
    user_id: PyObjectId # Changed from str to PyObjectId to fix the bug
    status: str = Field(default="DRAFT", example="DRAFT") # DRAFT, PUBLISHED, FAILED
    created_at: datetime = Field(default_factory=datetime.utcnow)
    error_message: Optional[str] = None

# --- Public Response Model (for API) ---
class AdCreativePublic(AdCreativeBase):
    model_config = ConfigDict(arbitrary_types_allowed=True, json_encoders={ObjectId: str})

    id: str = Field(..., description="The unique ID of the ad creative.")
    user_id: str = Field(..., description="The ID of the user who owns this ad.")
    status: str = Field(..., example="DRAFT")
    created_at: datetime
    error_message: Optional[str] = None

# --- AI Suggestion Schemas ---
class AIPlatformSuggestionRequest(BaseModel):
    ad_goal: str
    audience_description: str = Field(..., min_length=5, example="Gamers and tech enthusiasts")
    product_description: str = Field(..., min_length=10)

class AIPlatformSuggestionResponse(BaseModel):
    recommended_platform: str # "GOOGLE" or "META"
    recommendation: str # The justification text