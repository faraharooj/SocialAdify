# D:/socialadify/backend/app/services/image_service.py

from PIL import Image, ImageDraw, ImageFont
import uuid
import time
from pathlib import Path
from typing import Dict, Any # --- NEW: Import Any for type hinting ---

# Define root paths based on this file's location
_SERVICE_ROOT = Path(__file__).resolve().parent
_BACKEND_ROOT = _SERVICE_ROOT.parent.parent

# Define directories for assets and output
ASSETS_DIR = _BACKEND_ROOT / "assets"
GENERATED_POSTS_DIR = _BACKEND_ROOT / "static" / "generated_posts"
TEMPLATES_DIR = _BACKEND_ROOT / "static" / "templates"

# Ensure directories exist
GENERATED_POSTS_DIR.mkdir(parents=True, exist_ok=True)

# --- UPDATED: The function now accepts a dictionary for uploaded image files ---
def generate_image_from_template(
    template_doc: dict, 
    field_values: Dict[str, Any], 
    user_id: str
) -> str:
    """
    Generates an image by overlaying text and images onto a base template.

    Args:
        template_doc: The template document from MongoDB.
        field_values: A dictionary of user-provided text and uploaded image files.
        user_id: The ID of the current user to create a unique filename.

    Returns:
        The URL-friendly path to the newly generated image.
    """
    try:
        # 1. Load the base template image
        base_image_path = _BACKEND_ROOT / template_doc["base_image_path"]
        base_image = Image.open(base_image_path).convert("RGBA")
        draw = ImageDraw.Draw(base_image)

        # 2. Iterate through the editable fields defined in the template
        for field in template_doc["editable_fields"]:
            key = field["key"]
            field_type = field.get("type", "text") # Default to 'text' if type is missing

            # Check if the user provided input for this field
            if key in field_values and field_values[key]:
                
                # --- NEW: Logic to handle different field types ---
                if field_type == "text":
                    # --- This is the existing logic for drawing text ---
                    text_to_draw = str(field_values[key])
                    font_path = ASSETS_DIR / field["font"]
                    font = ImageFont.truetype(str(font_path), field["font_size"])
                    position = (field["position"]["x"], field["position"]["y"])
                    color = field["color"]
                    draw.text(position, text_to_draw, fill=color, font=font, anchor="lt")

                elif field_type == "image":
                    # --- This is the new logic for pasting an image ---
                    uploaded_image_file = field_values[key]
                    
                    # Open the uploaded image from the in-memory file
                    logo_image = Image.open(uploaded_image_file.file).convert("RGBA")
                    
                    # Get required dimensions from the template mapping
                    target_width = field["width"]
                    target_height = field["height"]
                    position = (field["position"]["x"], field["position"]["y"])

                    # Resize the logo to fit the template's placeholder size
                    logo_image.thumbnail((target_width, target_height))
                    
                    # Paste the resized logo onto the base image.
                    # The third argument (the logo itself) acts as a mask to handle transparency.
                    base_image.paste(logo_image, position, logo_image)

        # 4. Save the new image with a unique name
        timestamp = int(time.time())
        unique_filename = f"user_{user_id}_template_{timestamp}_{uuid.uuid4().hex[:6]}.png"
        output_path = GENERATED_POSTS_DIR / unique_filename
        
        base_image.save(output_path, "PNG")
        
        # 5. Return the path to the new image for API response
        return f"/static/generated_posts/{unique_filename}"

    except FileNotFoundError as e:
        print(f"Error: A required file was not found. {e}")
        raise ValueError(f"Missing asset file: {e.filename}")
    except Exception as e:
        print(f"An unexpected error occurred during image generation: {e}")
        raise

def optimize_image_for_instagram(image_path_str: str) -> str:
    """
    Takes a local file path, resizes it to max 1080px width, 
    converts to JPEG, and compresses it for fast API upload.
    
    Returns: The path to the OPTIMIZED image.
    """
    try:
        original_path = _BACKEND_ROOT / image_path_str.lstrip("/")
        if not original_path.exists():
            raise FileNotFoundError(f"Original image not found: {original_path}")

        # Open image
        with Image.open(original_path) as img:
            # Convert to RGB (drop alpha channel if PNG)
            img = img.convert("RGB")
            
            # Resize if width > 1080px (Instagram Standard)
            if img.width > 1080:
                aspect_ratio = img.height / img.width
                new_height = int(1080 * aspect_ratio)
                img = img.resize((1080, new_height), Image.LANCZOS)
            
            # Generate new filename
            optimized_filename = f"opt_{original_path.stem}.jpg"
            optimized_path = original_path.parent / optimized_filename
            
            # Save as JPEG with optimization
            img.save(optimized_path, "JPEG", quality=85, optimize=True)
            
            # Return the relative path string that matches your DB format
            # e.g., "/static/scheduled_post_images/opt_filename.jpg"
            # We assume the original was in a subfolder of 'static', so we preserve that parent.
            relative_parent = original_path.parent.relative_to(_BACKEND_ROOT)
            return f"/{relative_parent}/{optimized_filename}"

    except Exception as e:
        print(f"Image optimization failed: {e}")
        # Fallback: return the original path if optimization fails
        return image_path_str
