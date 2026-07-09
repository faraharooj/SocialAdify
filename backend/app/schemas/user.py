# D:/socialadify/backend/app/schemas/user.py

from pydantic import BaseModel, EmailStr, Field, ConfigDict, BeforeValidator, field_validator
from typing import Optional, Annotated, Any, List
from bson import ObjectId
import re
from datetime import datetime

# --- Validators and Helper Functions (Unchanged) ---
def validate_email_domain(email: EmailStr) -> EmailStr:
    if "@" not in email:
        raise ValueError("Invalid email format: missing '@' symbol.")
    domain = email.split('@', 1)[1].lower()
    if domain not in {"gmail.com", "yahoo.com", "outlook.com"}:
        raise ValueError(f"Email domain '@{domain}' is not allowed.")
    return email

def validate_password_complexity(password: str) -> str:
    if len(password) < 8: raise ValueError("Password must be at least 8 characters long.")
    if not re.search(r"[A-Z]", password): raise ValueError("Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", password): raise ValueError("Password must contain at least one lowercase letter.")
    if not re.search(r"[0-9]", password): raise ValueError("Password must contain at least one digit.")
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?~`]", password): raise ValueError("Password must contain at least one special character.")
    return password

def validate_object_id(v: Any) -> ObjectId:
    if isinstance(v, ObjectId): return v
    if ObjectId.is_valid(v): return ObjectId(v)
    raise ValueError(f"Invalid ObjectId: {v}")

PyObjectId = Annotated[ObjectId, BeforeValidator(validate_object_id)]


# --- Base and Creation Schemas (Unchanged) ---
class UserBase(BaseModel):
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    profile_picture_url: Optional[str] = None

class UserCreate(UserBase):
    email: EmailStr
    password: str = Field(..., min_length=8)
    firstname: str = Field(..., min_length=1)
    lastname: str = Field(..., min_length=1)
    
    @field_validator('email')
    @classmethod
    def check_email_domain_on_create(cls, value: EmailStr) -> EmailStr:
        return validate_email_domain(value)
    
    @field_validator('password')
    @classmethod
    def check_password_complexity(cls, value: str) -> str:
        return validate_password_complexity(value)

class UserUpdate(BaseModel):
    firstname: Optional[str] = Field(None, min_length=1)
    lastname: Optional[str] = Field(None, min_length=1)
    new_email: Optional[EmailStr] = Field(None, description="New email address for the user")
    
    @field_validator('new_email')
    @classmethod
    def check_new_email_domain_on_update(cls, value: Optional[EmailStr]) -> Optional[EmailStr]:
        if value is None: return value
        return validate_email_domain(value)


# --- Schema for a single Meta Page stored in the database ---
class MetaPageInDB(BaseModel):
    page_id: str
    page_name: str
    page_access_token: str
    instagram_id: Optional[str] = None
    instagram_username: Optional[str] = None


# --- Main Database and Public Schemas ---
class UserInDBBase(UserBase):
    email: EmailStr
    id: PyObjectId = Field(alias="_id")
    is_admin: bool = False
    password_reset_token: Optional[str] = None
    password_reset_expires: Optional[datetime] = None
    
    google_ad_account_id: Optional[str] = None
    google_access_token: Optional[str] = None
    google_refresh_token: Optional[str] = None
    google_token_expiry: Optional[datetime] = None

    meta_access_token: Optional[str] = None
    meta_access_token_expiry: Optional[datetime] = None

    # Meta ad account field addition
    meta_ad_account_id: Optional[str] = None
    meta_pages: Optional[List[MetaPageInDB]] = None
    linked_page_id: Optional[str] = None
    linked_page_name: Optional[str] = None
    linked_page_access_token: Optional[str] = None
    linked_instagram_id: Optional[str] = None
    linked_instagram_username: Optional[str] = None
    
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={ObjectId: str})

class UserInDB(UserInDBBase):
    hashed_password: str

class UserPublic(UserBase):
    id: str
    email: EmailStr
    is_admin: bool = False
    google_ad_account_id: Optional[str] = None
    meta_ad_account_id: Optional[str] = None
    
    # --- THE FIX: We expose the 'linked_' fields to the frontend ---
    linked_page_id: Optional[str] = None
    linked_page_name: Optional[str] = None
    linked_instagram_id: Optional[str] = None
    linked_instagram_username: Optional[str] = None

    @classmethod
    def from_user_in_db(cls, user_in_db: UserInDB) -> "UserPublic":
        return cls(
            id=str(user_in_db.id),
            email=user_in_db.email,
            firstname=user_in_db.firstname,
            lastname=user_in_db.lastname,
            profile_picture_url=user_in_db.profile_picture_url,
            is_admin=user_in_db.is_admin,
            google_ad_account_id=user_in_db.google_ad_account_id,

            # Meta Ad Account Field Added
            meta_ad_account_id=user_in_db.meta_ad_account_id,
            # Map the new "linked_" fields from the database model
            linked_page_id=user_in_db.linked_page_id,
            linked_page_name=user_in_db.linked_page_name,
            linked_instagram_id=user_in_db.linked_instagram_id,
            linked_instagram_username=user_in_db.linked_instagram_username,
        )


# --- Other Authentication-Related Schemas (Unchanged) ---
class ChangePasswordPayload(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

    @field_validator('new_password')
    @classmethod
    def check_new_password_complexity_on_change(cls, value: str) -> str:
        return validate_password_complexity(value)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)
    
    @field_validator('new_password')
    @classmethod
    def check_new_password_complexity(cls, value: str) -> str:
        return validate_password_complexity(value)

# --- NEW: Schema for the change password endpoint ---
class PasswordChange(BaseModel):
    current_password: str
    new_password: str


    # --- NEW: Schema for the delete account endpoint ---
class DeleteAccountRequest(BaseModel):
    password: str