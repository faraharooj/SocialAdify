# D:\socialadify\backend\app\crud\admin.py
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorCollection
from typing import List, Optional
import logging
from bson import ObjectId

from app.schemas.user import UserInDB, UserPublic # Import UserPublic for response formatting

USERS_COLLECTION = "users"
logger = logging.getLogger(__name__)

async def get_all_users(
    db: AsyncIOMotorDatabase,
    skip: int = 0,
    limit: int = 100,
    search_query: Optional[str] = None
) -> List[UserInDB]:
    """
    Retrieves all user profiles with optional search and pagination.
    """
    users_collection: AsyncIOMotorCollection = db[USERS_COLLECTION]
    query_filter = {}
    if search_query:
        # Case-insensitive search on email, firstname, lastname
        query_filter["$or"] = [
            {"email": {"$regex": search_query, "$options": "i"}},
            {"firstname": {"$regex": search_query, "$options": "i"}},
            {"lastname": {"$regex": search_query, "$options": "i"}}
        ]
        logger.info(f"Admin: Searching users with query: '{search_query}'")

    # Sort by creation date or email for consistent pagination/ordering
    users_cursor = users_collection.find(query_filter).sort("email", 1).skip(skip).limit(limit)
    users_list = await users_cursor.to_list(length=limit)

    logger.info(f"Admin: Found {len(users_list)} users (skip: {skip}, limit: {limit}, search: '{search_query}')")
    return [UserInDB(**user_data) for user_data in users_list]

async def get_users_count(
    db: AsyncIOMotorDatabase,
    search_query: Optional[str] = None
) -> int:
    """
    Returns the total count of users, optionally filtered by a search query.
    """
    users_collection: AsyncIOMotorCollection = db[USERS_COLLECTION]
    query_filter = {}
    if search_query:
        query_filter["$or"] = [
            {"email": {"$regex": search_query, "$options": "i"}},
            {"firstname": {"$regex": search_query, "$options": "i"}},
            {"lastname": {"$regex": search_query, "$options": "i"}}
        ]
    count = await users_collection.count_documents(query_filter)
    logger.info(f"Admin: Total user count (search: '{search_query}'): {count}")
    return count


async def delete_user_by_id(db: AsyncIOMotorDatabase, user_id: ObjectId) -> bool:
    """
    Deletes a user account by their ID.
    Returns True if deletion was successful, False otherwise.
    """
    logger.info(f"Admin: Attempting to delete user with ID: {user_id}")
    users_collection: AsyncIOMotorCollection = db[USERS_COLLECTION]
    delete_result = await users_collection.delete_one({"_id": user_id})

    if delete_result.deleted_count == 1:
        logger.info(f"Admin: User deleted successfully: ID {user_id}")
        return True
    logger.warning(f"Admin: User not found for deletion: ID {user_id}")
    return False

# You might also want to add functions for:
# - get_user_by_id_admin (similar to get_user_by_email, but by ID)
# - update_user_by_id_admin (to change user roles, etc.)
