from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Any
from bson import ObjectId
from app.schemas.user import PyObjectId

async def get_all_templates(db: AsyncIOMotorDatabase) -> List[Dict[str, Any]]:
    """Fetches all templates from the database."""
    templates = await db["templates"].find().to_list(length=100)
    return templates

async def get_template_by_id(db: AsyncIOMotorDatabase, template_id: PyObjectId) -> Dict[str, Any] | None:
    """Fetches a single template by its ID."""
    template = await db["templates"].find_one({"_id": template_id})
    return template