# D:\socialadify\backend\app\api\post_generator\schemas.py
from pydantic import BaseModel, Field
from typing import List, Literal
from datetime import datetime
from bson import ObjectId
from app.schemas.user import PyObjectId

class PostGenerationRequest(BaseModel):
    product_name: str
    target_audience: str
    key_features: List[str]
    tone: str
    platform: str
    call_to_action: str
    aspect_ratio: str

class PostGenerationResponse(BaseModel):
    image_data_url: str
    prompt_used: str

class GeneratedPostCreate(BaseModel):
    user_id: PyObjectId
    image_url: str
    prompt_used: str
    original_request: PostGenerationRequest
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True

class SavePostRequest(BaseModel):
    image_data_url: str
    prompt_used: str
    original_request: PostGenerationRequest

# --- UPDATED PUBLIC SCHEMA ---
class GeneratedPostPublic(BaseModel):
    # *** THIS IS THE FIX ***
    # The alias is re-added. This allows Pydantic to correctly map
    # the '_id' field from the database to the 'id' field in the model.
    id: str = Field(alias="_id")
    user_id: str
    image_url: str
    prompt_used: str
    original_request: PostGenerationRequest
    created_at: datetime
    item_type: Literal["post"] = "post"

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
