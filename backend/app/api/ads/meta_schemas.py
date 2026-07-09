# D:/socialadify/backend/app/api/ads/meta_schemas.py

from pydantic import BaseModel, Field, ConfigDict, BeforeValidator
from typing import Optional, List, Annotated
from datetime import datetime
from bson import ObjectId

# --- ObjectId Helper Class (Copied from other schema) ---
def validate_object_id(v):
    if not ObjectId.is_valid(v):
        raise ValueError("Invalid ObjectId")
    return v

PyObjectId = Annotated[ObjectId, BeforeValidator(validate_object_id)]

# --- Base Schemas ---

class MetaAdCreativeBase(BaseModel):
    """
    Defines the core fields for a Meta Ad creative.
    """
    campaign_name: str = Field(..., example="Meta Summer Sale")
    # Meta's objectives are different, e.g., 'OUTCOME_TRAFFIC', 'OUTCOME_AWARENESS', 'OUTCOME_LEADS'
    ad_goal: str = Field(..., example="OUTCOME_TRAFFIC") 
    platform: str = Field(default="META", example="META")
    budget: Optional[float] = Field(default=None, example=1000.0, description="Daily budget in local currency (e.g., PKR)")
    # Meta-specific creative fields
    primary_text: str = Field(..., description="The main text/caption for the ad.", example="Check out our amazing summer sale!")
    headline: str = Field(..., description="The shorter headline, e.g., for link ads.", example="50% Off All T-Shirts")
    website_url: str = Field(..., description="The destination URL.", example="https://www.socialadify.com/sale")
    
    # Meta has a specific list of CTA types
    call_to_action: str = Field(..., example="SHOP_NOW") 

    # We will start with a single image, just like the scheduler
    image_url: Optional[str] = Field(default=None, example="/static/ad_creative_images/meta_ad_123.png")

# --- API Schemas ---

class MetaAdCreativePayload(MetaAdCreativeBase):
    """Payload from the client to create a new Meta ad draft."""
    budget: float = Field(..., example=1000.0, description="Daily budget in local currency (e.g., PKR)")
    pass

class MetaAdCreativeUpdate(BaseModel):
    """Payload to update an existing Meta ad draft."""
    campaign_name: Optional[str] = None
    ad_goal: Optional[str] = None
    budget: Optional[float] = None
    primary_text: Optional[str] = None
    headline: Optional[str] = None
    website_url: Optional[str] = None
    call_to_action: Optional[str] = None
    image_url: Optional[str] = None

# --- Database Model (for internal use) ---
class MetaAdCreativeInDB(MetaAdCreativeBase):
    """The full ad draft model as stored in MongoDB."""
    model_config = ConfigDict(arbitrary_types_allowed=True, json_encoders={ObjectId: str})
    
    id: PyObjectId = Field(alias="_id")
    user_id: PyObjectId
    status: str = Field(default="DRAFT", example="DRAFT") # DRAFT, PUBLISHED, FAILED
    created_at: datetime = Field(default_factory=datetime.utcnow)
    error_message: Optional[str] = None # For publishing errors

# --- Public Response Model (for API) ---
class MetaAdCreativePublic(MetaAdCreativeBase):
    """The ad draft model as returned to the client."""
    model_config = ConfigDict(arbitrary_types_allowed=True, json_encoders={ObjectId: str})

    id: str = Field(..., description="The unique ID of the ad creative.")
    user_id: str = Field(..., description="The ID of the user who owns this ad.")
    status: str = Field(..., example="DRAFT")
    created_at: datetime
    error_message: Optional[str] = None