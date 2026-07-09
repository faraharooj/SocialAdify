# D:/socialadify/backend/app/api/templates/schemas.py

from pydantic import BaseModel, Field, computed_field
from typing import List, Dict, Union, Literal
from bson import ObjectId
from app.schemas.user import PyObjectId

# --- Sub-models for nested data ---
class Position(BaseModel):
    x: int
    y: int

# --- NEW: Specific model for Text fields ---
class EditableTextField(BaseModel):
    key: str
    label: str
    type: Literal["text"] = "text"
    position: Position
    font: str
    font_size: int
    color: str
    max_length: int = 100

# --- NEW: Specific model for Image fields ---
class EditableImageField(BaseModel):
    key: str
    label: str
    type: Literal["image"] = "image"
    position: Position
    width: int
    height: int

# --- NEW: A Union type that can be either a text field or an image field ---
EditableField = Union[EditableTextField, EditableImageField]

# --- Core Template Model for Database (UPDATED) ---
class TemplateInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    name: str
    description: str
    base_image_path: str
    preview_image_path: str
    # This field can now contain both text and image field definitions
    editable_fields: List[EditableField]

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# --- Public model for API responses (UPDATED) ---
class TemplatePublic(BaseModel):
    mongo_id: PyObjectId = Field(alias="_id")
    name: str
    description: str
    preview_image_path: str
    base_image_path: str
    # This field now also supports both types
    editable_fields: List[EditableField] 

    @computed_field
    @property
    def id(self) -> str:
        return str(self.mongo_id)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, PyObjectId: str}

# --- REMOVED: This is no longer needed as we'll use Form data ---
# class TemplateGenerationRequest(BaseModel):
#     field_values: Dict[str, str]

# --- This schema remains the same ---
class TemplateGenerationResponse(BaseModel):
    """ The response containing the URL of the final image """
    generated_image_url: str

