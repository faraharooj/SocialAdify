# D:\socialadify\backend\app\crud\generated_post.py
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorCollection
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import logging
from pathlib import Path # Import Path for file operations

from app.api.post_generator.schemas import GeneratedPostCreate, GeneratedPostPublic

GENERATED_POSTS_COLLECTION = "generated_posts"
logger = logging.getLogger(__name__)
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
SAVED_POSTS_DIR = _BACKEND_ROOT / "static" / "generated_posts"


async def create_generated_post(db: AsyncIOMotorDatabase, post_in: GeneratedPostCreate):
    logger.info(f"Saving generated post for user_id: {post_in.user_id}")
    collection: AsyncIOMotorCollection = db[GENERATED_POSTS_COLLECTION]
    post_doc = post_in.model_dump()
    await collection.insert_one(post_doc)
    logger.info(f"Post saved successfully for user_id: {post_in.user_id}")
    return True

async def get_generated_posts_by_user_id(db: AsyncIOMotorDatabase, user_id: ObjectId) -> List[GeneratedPostPublic]:
    logger.info(f"Fetching generated posts for user_id: {user_id}")
    collection: AsyncIOMotorCollection = db[GENERATED_POSTS_COLLECTION]
    
    posts_cursor = collection.find({"user_id": user_id})
    posts_list = await posts_cursor.to_list(length=None)
    
    validated_posts = []
    for post in posts_list:
        post["_id"] = str(post["_id"])
        post["user_id"] = str(post["user_id"])
        validated_posts.append(GeneratedPostPublic.model_validate(post))
        
    return validated_posts

# --- NEW FUNCTION TO GET A SINGLE POST ---
async def get_post_by_id_for_user(db: AsyncIOMotorDatabase, post_id: ObjectId, user_id: ObjectId) -> Optional[dict]:
    """Retrieves a single post from the database for a specific user."""
    collection: AsyncIOMotorCollection = db[GENERATED_POSTS_COLLECTION]
    post = await collection.find_one({"_id": post_id, "user_id": user_id})
    return post

# --- NEW FUNCTION TO DELETE A POST ---
async def delete_post_by_id(db: AsyncIOMotorDatabase, post_id: ObjectId) -> bool:
    """Deletes a single post from the database by its ID."""
    collection: AsyncIOMotorCollection = db[GENERATED_POSTS_COLLECTION]
    delete_result = await collection.delete_one({"_id": post_id})
    return delete_result.deleted_count > 0
