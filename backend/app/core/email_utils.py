# D:\socialadify\backend\app\core\email_utils.py
import logging
import os # For FRONTEND_URL

logger = logging.getLogger(__name__)

# Get FRONTEND_URL from environment or use a default
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

async def send_password_reset_email(email_to: str, username: str, token: str): # Removed frontend_base_url from params
    """
    Simulates sending a password reset email by logging it to the console.
    """
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}" # Ensure this matches your frontend route
    
    email_subject = "SocialAdify - Password Reset Request (Simulated)"
    email_body = f"""
    Hi {username},

    You requested a password reset for your SocialAdify account.
    Please click the link below or copy and paste it into your browser to reset your password:
    {reset_link}

    This link will expire in 1 hour.

    If you did not request a password reset, please ignore this email.

    Thanks,
    The SocialAdify Team
    """
    
    logger.info("---- SIMULATING SENDING PASSWORD RESET EMAIL ----")
    logger.info(f"To: {email_to}")
    logger.info(f"Subject: {email_subject}")
    logger.info(f"Body:\n{email_body}")
    logger.info(f"Reset Link (for testing): {reset_link}") # Log the link clearly
    logger.info("--------------------------------------------------")
    # No actual email is sent.
