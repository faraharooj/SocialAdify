# D:/socialadify/backend/app/crud/user.py

from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorCollection 
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status
import logging
from bson import ObjectId
from datetime import datetime, timedelta 

from app.schemas.user import UserCreate, UserInDB, UserPublic, UserUpdate 
from app.core.security import get_password_hash, verify_password
from app.crud.caption import delete_captions_by_user_id

USERS_COLLECTION = "users"
logging.basicConfig(level=logging.INFO) 
logger = logging.getLogger(__name__)

# --- Core User Functions ---
async def get_user_by_email(db: AsyncIOMotorDatabase, email: str) -> Optional[UserInDB]:
    """Retrieves a user from the database by their email address."""
    users_collection: AsyncIOMotorCollection = db[USERS_COLLECTION]
    user_data = await users_collection.find_one({"email": email.lower()}) 
    return UserInDB(**user_data) if user_data else None

async def get_user_by_id(db: AsyncIOMotorDatabase, user_id: str) -> Optional[UserInDB]:
    """Retrieves a user from the database by their ObjectId string."""
    if not ObjectId.is_valid(user_id):
        return None
    user_doc = await db[USERS_COLLECTION].find_one({"_id": ObjectId(user_id)})
    return UserInDB(**user_doc) if user_doc else None

async def create_user(db: AsyncIOMotorDatabase, user_create: UserCreate) -> UserPublic:
    """Creates a new user in the database."""
    if await get_user_by_email(db, email=user_create.email.lower()):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    hashed_password = get_password_hash(user_create.password)
    user_in_db_data = user_create.model_dump()
    user_in_db_data["email"] = user_create.email.lower() 
    user_in_db_data["hashed_password"] = hashed_password
    del user_in_db_data["password"]
    
    result = await db[USERS_COLLECTION].insert_one(user_in_db_data)
    created_user_data = await db[USERS_COLLECTION].find_one({"_id": result.inserted_id})
    if not created_user_data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not create user after insertion.")
    
    return UserPublic.from_user_in_db(UserInDB(**created_user_data))

async def authenticate_user(db: AsyncIOMotorDatabase, email: str, password: str) -> Optional[UserInDB]:
    """Authenticates a user by checking their email and password."""
    user = await get_user_by_email(db, email=email.lower())
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

async def update_user_profile(
    db: AsyncIOMotorDatabase, 
    user_id: ObjectId,
    user_update_data: UserUpdate, 
    profile_picture_url: Optional[str] = None 
) -> Optional[UserInDB]:
    """Updates a user's profile information (text fields and/or profile picture)."""
    update_data: Dict[str, Any] = user_update_data.model_dump(exclude_unset=True)
    
    if 'new_email' in update_data:
        new_email_lower = update_data.pop('new_email').lower()
        if await db[USERS_COLLECTION].find_one({"email": new_email_lower, "_id": {"$ne": user_id}}):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New email address is already in use.")
        update_data["email"] = new_email_lower

    if profile_picture_url is not None: 
        update_data["profile_picture_url"] = profile_picture_url
        
    if not update_data:
        return await get_user_by_id(db, str(user_id))

    await db[USERS_COLLECTION].update_one({"_id": user_id}, {"$set": update_data})
    return await get_user_by_id(db, str(user_id))

# --- Password Management and Deletion Functions ---
async def set_password_reset_token(db: AsyncIOMotorDatabase, user: UserInDB, token: str, expires_delta_seconds: int) -> bool:
    expires_at = datetime.utcnow() + timedelta(seconds=expires_delta_seconds)
    result = await db[USERS_COLLECTION].update_one({"_id": user.id}, {"$set": {"password_reset_token": token, "password_reset_expires": expires_at}})
    return result.modified_count == 1

async def get_user_by_password_reset_token(db: AsyncIOMotorDatabase, token: str) -> Optional[UserInDB]:
    user_data = await db[USERS_COLLECTION].find_one({"password_reset_token": token, "password_reset_expires": {"$gt": datetime.utcnow()}})
    return UserInDB(**user_data) if user_data else None

async def update_user_password(db: AsyncIOMotorDatabase, user: UserInDB, new_password: str) -> bool: 
    hashed_password = get_password_hash(new_password)
    result = await db[USERS_COLLECTION].update_one({"_id": user.id}, {"$set": {"hashed_password": hashed_password, "password_reset_token": None, "password_reset_expires": None}})
    return result.modified_count == 1

async def change_password(db: AsyncIOMotorDatabase, user: UserInDB, current_password: str, new_password: str) -> bool:
    if not verify_password(current_password, user.hashed_password):
        return False 
    new_hashed_password = get_password_hash(new_password)
    result = await db[USERS_COLLECTION].update_one({"_id": user.id}, {"$set": {"hashed_password": new_hashed_password}})
    return result.modified_count == 1

async def delete_user(db: AsyncIOMotorDatabase, user: UserInDB, current_password_to_verify: str) -> bool:
    if not verify_password(current_password_to_verify, user.hashed_password):
        return False
    await delete_captions_by_user_id(db, user_id=user.id)
    delete_result = await db[USERS_COLLECTION].delete_one({"_id": user.id})
    return delete_result.deleted_count == 1

# --- Google Credential Functions ---
async def update_user_google_credentials(db: AsyncIOMotorDatabase, user_id: ObjectId, access_token: str, refresh_token: str, expiry: datetime) -> Optional[UserInDB]:
    update_data = {"google_access_token": access_token, "google_refresh_token": refresh_token, "google_token_expiry": expiry}
    await db[USERS_COLLECTION].update_one({"_id": user_id}, {"$set": update_data})
    updated_user_doc = await db[USERS_COLLECTION].find_one({"_id": user_id})
    return UserInDB(**updated_user_doc) if updated_user_doc else None

async def set_user_google_ad_account(db: AsyncIOMotorDatabase, user_id: ObjectId, ad_account_id: str) -> Optional[UserInDB]:
    await db[USERS_COLLECTION].update_one({"_id": user_id}, {"$set": {"google_ad_account_id": ad_account_id}})
    updated_user_doc = await db[USERS_COLLECTION].find_one({"_id": user_id})
    return UserInDB(**updated_user_doc) if updated_user_doc else None

async def set_user_meta_ad_account(db: AsyncIOMotorDatabase, user_id: ObjectId, ad_account_id: str) -> Optional[UserInDB]:
    """Saves the user's default Meta Ad Account ID."""
    await db[USERS_COLLECTION].update_one({"_id": user_id}, {"$set": {"meta_ad_account_id": ad_account_id}})
    updated_user_doc = await db[USERS_COLLECTION].find_one({"_id": user_id})
    return UserInDB(**updated_user_doc) if updated_user_doc else None

# --- NEW: Functions for the Server-Side Page Access Token Flow ---

async def update_user_meta_token(
    db: AsyncIOMotorDatabase, 
    user_id: ObjectId, 
    token: str, 
    expires_in_seconds: int
) -> Optional[UserInDB]:
    """Saves the long-lived user-level Meta access token and its expiry date."""
    expiry_time = datetime.utcnow() + timedelta(seconds=expires_in_seconds) if expires_in_seconds else None
    update_data = {
        "meta_access_token": token,
        "meta_access_token_expiry": expiry_time
    }
    await db[USERS_COLLECTION].update_one({"_id": user_id}, {"$set": update_data})
    return await get_user_by_id(db, str(user_id))

async def update_user_meta_pages(
    db: AsyncIOMotorDatabase, 
    user_id: ObjectId, 
    pages: List[Dict[str, Any]]
) -> Optional[UserInDB]:
    """Saves the cache of all available pages and their tokens to the user document."""
    await db[USERS_COLLECTION].update_one({"_id": user_id}, {"$set": {"meta_pages": pages}})
    return await get_user_by_id(db, str(user_id))

async def update_user_linked_meta_accounts(
    db: AsyncIOMotorDatabase, 
    user_id: ObjectId, 
    page_id: str,
    page_name: str,
    page_access_token: str,
    instagram_id: Optional[str],
    instagram_username: Optional[str]
) -> Optional[UserInDB]:
    """Saves the final selected Page and its specific access token for the scheduler to use."""
    update_data = {
        "linked_page_id": page_id,
        "linked_page_name": page_name,
        "linked_page_access_token": page_access_token, # This is the crucial token for publishing
        "linked_instagram_id": instagram_id,
        "linked_instagram_username": instagram_username,
    }
    await db[USERS_COLLECTION].update_one({"_id": user_id}, {"$set": update_data})
    return await get_user_by_id(db, str(user_id))

async def disconnect_meta_account(
    db: AsyncIOMotorDatabase, 
    user_id: ObjectId
) -> Optional[UserInDB]:
    """Clears all Meta-related fields from the user's document for a clean disconnect."""
    fields_to_unset = {
        "meta_access_token": "", "meta_access_token_expiry": "",
        "meta_pages": "",
        "linked_page_id": "", "linked_page_name": "", "linked_page_access_token": "",
        "linked_instagram_id": "", "linked_instagram_username": ""
    }
    await db[USERS_COLLECTION].update_one({"_id": user_id}, {"$unset": fields_to_unset})
    return await get_user_by_id(db, str(user_id))

