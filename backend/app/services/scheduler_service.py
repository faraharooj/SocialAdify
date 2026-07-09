# D:\socialadify\backend\app\services\scheduler_service.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timezone
import logging

from app.crud import scheduled_post as scheduler_crud
from app.crud import user as user_crud
from app.db.session import get_database_context
from app.services.image_service import optimize_image_for_instagram
# --- FIX: Import both new functions from meta_service ---
from app.services.meta_service import (
    publish_photo_to_facebook_page, 
    publish_photo_to_instagram
)

logger = logging.getLogger(__name__)

async def process_due_posts():
    """
    Fetches and processes due posts, routing to the correct Meta platform
    (Facebook or Instagram) based on the post's target_platform.
    """
    logger.info("Scheduler job started: Checking for due posts...")
    
    async with get_database_context() as db:
        if db is None:
            logger.error("Could not get database connection for scheduler job.")
            return
            
        due_posts = await scheduler_crud.get_due_posts(db)

        if not due_posts:
            logger.info("No due posts found.")
            return

        logger.info(f"Found {len(due_posts)} due posts to process.")

        for post in due_posts:
            post_id = post.id
            logger.info(f"Processing post ID: {post_id} for platform: {post.target_platform}")
            
            try:
                await scheduler_crud.update_post_status(db, post_id, "processing")

                post_user = await user_crud.get_user_by_id(db, user_id=str(post.user_id))
                if not post_user:
                    raise Exception(f"User {post.user_id} not found for post {post_id}.")

                # --- THIS IS THE CORE FIX ---

                if not post_user.linked_page_access_token:
                    raise Exception("User has not linked a Meta Page with a valid Page Access Token.")
                
                page_access_token = post_user.linked_page_access_token
                published_post_id = None
                optimized_image_url = optimize_image_for_instagram(post.image_url)
                logger.info(f"Optimized image for upload: {optimized_image_url}")

                if post.target_platform == "Facebook":
                    if not post_user.linked_page_id:
                        raise Exception("User has not linked a Facebook Page ID.")
                    
                    logger.info(f"Routing post {post_id} to Facebook Page: {post_user.linked_page_id}")
                    published_post_id = await publish_photo_to_facebook_page(
                        db=db,
                        user_id=post_user.id,
                        page_id=post_user.linked_page_id,
                        page_access_token=page_access_token,
                        image_url_from_db=optimized_image_url,
                        caption=post.caption
                    )

                elif post.target_platform == "Instagram":
                    if not post_user.linked_instagram_id:
                        raise Exception("User has not linked an Instagram Account ID.")

                    logger.info(f"Routing post {post_id} to Instagram Account: {post_user.linked_instagram_id}") # Corrected from linked_instagram_id to linked_inventory_id
                    published_post_id = await publish_photo_to_instagram(
                        db=db,
                        user_id=post_user.id,
                        instagram_id=post_user.linked_instagram_id,
                        page_access_token=page_access_token,
                        image_url_from_db=optimized_image_url,
                        caption=post.caption
                    )
                
                else:
                    # Handle other platforms or cases if necessary
                    raise Exception(f"Unsupported target platform for auto-posting: {post.target_platform}")

                # --- END OF FIX ---
                
                await scheduler_crud.update_post_status(db, post_id, "completed")
                logger.info(f"Successfully processed and published post ID: {post_id}. New Meta ID: {published_post_id}")

            except Exception as e:
                error_message = str(e)
                logger.error(f"Failed to process post {post_id}: {error_message}", exc_info=True)
                await scheduler_crud.update_post_status(db, post_id, "failed", error_message=error_message)

    logger.info("Scheduler job finished.")

# --- Scheduler Setup (Unchanged) ---
scheduler = AsyncIOScheduler(timezone="UTC")

def start_scheduler():
    logger.info("Starting background scheduler...")
    scheduler.add_job(process_due_posts, 'interval', minutes=1, next_run_time=datetime.now(timezone.utc))
    scheduler.start()
    logger.info("Background scheduler started, running every minute.")