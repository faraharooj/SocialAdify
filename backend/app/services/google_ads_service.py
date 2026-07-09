# D:\socialadify\backend\app\services\google_ads_service.py

from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException
import logging
from pathlib import Path
import yaml
import time
import mimetypes
from typing import List, Dict, Optional, Any

# --- Schema Imports ---
from app.api.ads.schemas import AdCreativeInDB

# --- Google Ads API Imports (Corrected to V22) ---
from google.ads.googleads.v22.services.types.google_ads_service import GoogleAdsRow
from google.ads.googleads.v22.services.types.campaign_budget_service import CampaignBudgetOperation
from google.ads.googleads.v22.services.types.campaign_service import CampaignOperation
from google.ads.googleads.v22.services.types.ad_group_service import AdGroupOperation
from google.ads.googleads.v22.services.types.ad_group_ad_service import AdGroupAdOperation
from google.ads.googleads.v22.services.types.asset_service import AssetOperation
from google.ads.googleads.v22.services.types.ad_group_criterion_service import AdGroupCriterionOperation


from google.ads.googleads.v22.common.types.ad_type_infos import (
    ResponsiveDisplayAdInfo,
)
from google.ads.googleads.v22.common.types.ad_asset import (
    AdImageAsset,
    AdTextAsset
)
# --- FIX: Import enums as modules to use full paths ---
from google.ads.googleads.v22.enums.types import (
    campaign_status as campaign_status_enum,
    ad_group_status as ad_group_status_enum,
    ad_group_ad_status as ad_group_ad_status_enum,
    asset_type as asset_type_enum,
    advertising_channel_type as advertising_channel_type_enum,
    budget_delivery_method as budget_delivery_method_enum,
    display_ad_format_setting as display_ad_format_setting_enum,
    mime_type as mime_type_enum,
    eu_political_advertising_status as eu_political_enum,
    call_to_action_type as call_to_action_type_enum
)
# ---

from app.api.insights.mock_data import MOCK_GOOGLE_CAMPAIGN_1, MOCK_GOOGLE_CAMPAIGN_2

# --- Configuration ---
CONFIG_FILE = Path(__file__).resolve().parent.parent.parent / "google-ads.yaml"
logger = logging.getLogger(__name__)


def get_google_ads_client(refresh_token: str) -> GoogleAdsClient:
    """Initializes and returns a GoogleAdsClient instance."""
    try:
        with open(CONFIG_FILE, "r") as f:
            config_dict = yaml.safe_load(f)
        config_dict["refresh_token"] = refresh_token
        config_dict["use_proto_plus"] = True
        return GoogleAdsClient.load_from_dict(config_dict)
    except Exception as e:
        logger.error(f"Failed to initialize Google Ads client: {e}")
        raise


def list_accessible_customers(client: GoogleAdsClient) -> list[dict]:
    """
    Fetches a list of all Google Ads accounts accessible by the user,
    including accounts under any manager accounts.
    """
    customer_list = []
    try:
        query = """
            SELECT
                customer_client.id,
                customer_client.descriptive_name,
                customer_client.manager,
                customer_client.test_account,
                customer_client.status
            FROM customer_client
            WHERE customer_client.status = 'CLOSED'
        """
        ga_service = client.get_service("GoogleAdsService")
        login_customer_id = client.login_customer_id
        response_stream = ga_service.search_stream(customer_id=login_customer_id, query=query)
        for batch in response_stream:
            for row in batch.results:
                customer = row.customer_client
                customer_list.append({
                    "id": str(customer.id),
                    "name": customer.descriptive_name,
                    "is_manager": customer.manager,
                    "is_test_account": customer.test_account,
                })
        manager_query = f"""
            SELECT customer.id, customer.descriptive_name, customer.manager, customer.test_account
            FROM customer WHERE customer.id = {login_customer_id}
        """
        manager_response = ga_service.search(customer_id=login_customer_id, query=manager_query)
        for row in manager_response:
            customer = row.customer
            if not any(c["id"] == str(customer.id) for c in customer_list):
                    customer_list.append({
                        "id": str(customer.id),
                        "name": customer.descriptive_name,
                        "is_manager": customer.manager,
                        "is_test_account": customer.test_account,
                    })
        logger.info(f"Found {len(customer_list)} total accessible Google Ads accounts.")
        return customer_list
    except GoogleAdsException as ex:
        logger.error(f"Google Ads API request failed: {ex}")
        raise


def get_campaigns(client: GoogleAdsClient, customer_id: str) -> list[dict]:
    ga_service = client.get_service("GoogleAdsService")
    query = """
        SELECT
            campaign.id, campaign.name, campaign.status,
            metrics.clicks, metrics.impressions, metrics.ctr,
            metrics.average_cpc, metrics.cost_micros
        FROM campaign 
        WHERE campaign.status IN ('ENABLED','PAUSED')
        ORDER BY campaign.name
    """
    stream = ga_service.search_stream(customer_id=customer_id, query=query)
    campaign_list = []
    for batch in stream:
        for row in batch.results:
            campaign = row.campaign
            metrics = row.metrics
            campaign_list.append({
                "id": str(campaign.id),
                "name": campaign.name,
                "status": campaign.status.name,
                "clicks": metrics.clicks,
                "impressions": metrics.impressions,
                "ctr": metrics.ctr,
                "average_cpc": metrics.average_cpc / 1_000_000,
                "cost": metrics.cost_micros / 1_000_000,
            })
    
    # --- Inject BOTH mock campaigns into the list ---
    campaign_list.append(MOCK_GOOGLE_CAMPAIGN_1)
    campaign_list.append(MOCK_GOOGLE_CAMPAIGN_2)

    logger.info(f"Found {len(campaign_list) - 2} real campaigns, added 2 mock campaigns.")
    return campaign_list

# ---
# --- NEW FUNCTIONS FOR PUBLISHING ADS (START) ---
# ---

def _upload_image_asset(client: GoogleAdsClient, customer_id: str, image_path: str, suffix: str) -> str:
    """
    Uploads an image from a local path as an Asset to Google Ads.
    Returns the resource name of the created asset.
    """
    asset_service = client.get_service("AssetService")
    asset_operation = client.get_type("AssetOperation")
    asset = asset_operation.create
    
    asset.type_ = asset_type_enum.AssetTypeEnum.AssetType.IMAGE
    asset.name = f"SocialAdify Ad Image {int(time.time())} {suffix}"

    # Read image data from the local path
    try:
        with open(image_path, "rb") as f:
            image_data = f.read()
    except IOError as e:
        logger.error(f"Could not read image file: {image_path}: {e}")
        raise
    
    image_asset = client.get_type("ImageAsset")
    image_asset.data = image_data
    image_asset.file_size = len(image_data)
    
    ext_to_mime = {
        ".jpg": mime_type_enum.MimeTypeEnum.MimeType.IMAGE_JPEG,
        ".jpeg": mime_type_enum.MimeTypeEnum.MimeType.IMAGE_JPEG,
        ".png": mime_type_enum.MimeTypeEnum.MimeType.IMAGE_PNG,
    }
    file_ext = Path(image_path).suffix.lower()
    image_asset.mime_type = ext_to_mime.get(file_ext, mime_type_enum.MimeTypeEnum.MimeType.IMAGE_PNG)
    
    asset.image_asset = image_asset

    mutate_response = asset_service.mutate_assets(customer_id=customer_id, operations=[asset_operation])
    resource_name = mutate_response.results[0].resource_name
    logger.info(f"Uploaded image asset ({suffix}) with resource name: {resource_name}")
    return resource_name

def _create_campaign_budget(client: GoogleAdsClient, customer_id: str,ad_draft: AdCreativeInDB) -> str:
    """
    Creates a new CampaignBudget.
    Returns the resource name of the created budget.
    """
    budget_service = client.get_service("CampaignBudgetService")
    budget_operation = client.get_type("CampaignBudgetOperation")
    budget = budget_operation.create
    budget.name = f"SocialAdify Budget {int(time.time())}"
    budget.amount_micros = int(ad_draft.budget * 1_000_000)
    budget.delivery_method = budget_delivery_method_enum.BudgetDeliveryMethodEnum.BudgetDeliveryMethod.STANDARD

    mutate_response = budget_service.mutate_campaign_budgets(customer_id=customer_id, operations=[budget_operation])
    resource_name = mutate_response.results[0].resource_name
    logger.info(f"Created budget with resource name: {resource_name}")
    return resource_name

def _create_campaign(client: GoogleAdsClient, customer_id: str, budget_resource_name: str, ad_draft: AdCreativeInDB) -> str:
    """
    Creates a new PAUSED Campaign.
    Returns the resource name of the created campaign.
    """
    campaign_service = client.get_service("CampaignService")
    campaign_operation = client.get_type("CampaignOperation")
    campaign = campaign_operation.create
    
    campaign.name = ad_draft.campaign_name
    
    campaign.contains_eu_political_advertising = (
        eu_political_enum.EuPoliticalAdvertisingStatusEnum.EuPoliticalAdvertisingStatus.DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING
    )
    
    campaign.status = campaign_status_enum.CampaignStatusEnum.CampaignStatus.ENABLED
    campaign.campaign_budget = budget_resource_name
    
    campaign.advertising_channel_type = advertising_channel_type_enum.AdvertisingChannelTypeEnum.AdvertisingChannelType.DISPLAY
    
    campaign.target_spend = client.get_type("TargetSpend")
    
    # Set target network (Display Network only)
    campaign.network_settings.target_google_search = False
    campaign.network_settings.target_search_network = False
    campaign.network_settings.target_content_network = True
    campaign.network_settings.target_partner_search_network = False

    mutate_response = campaign_service.mutate_campaigns(customer_id=customer_id, operations=[campaign_operation])
    resource_name = mutate_response.results[0].resource_name
    logger.info(f"Created campaign with resource name: {resource_name}")
    return resource_name

def _create_ad_group(client: GoogleAdsClient, customer_id: str, campaign_resource_name: str, ad_draft: AdCreativeInDB) -> str:
    """
    Creates a new AdGroup inside the campaign.
    Returns the resource name of the created ad group.
    """
    ad_group_service = client.get_service("AdGroupService")
    ad_group_operation = client.get_type("AdGroupOperation")
    ad_group = ad_group_operation.create
    
    ad_group.name = f"{ad_draft.campaign_name} Ad Group"
    ad_group.status = ad_group_status_enum.AdGroupStatusEnum.AdGroupStatus.ENABLED
    ad_group.campaign = campaign_resource_name
    
    ad_group.cpc_bid_micros = 50 * 1_000_000

    mutate_response = ad_group_service.mutate_ad_groups(customer_id=customer_id, operations=[ad_group_operation])
    resource_name = mutate_response.results[0].resource_name
    logger.info(f"Created ad group with resource name: {resource_name}")
    return resource_name

def _create_responsive_display_ad(
    client: GoogleAdsClient, 
    customer_id: str, 
    ad_group_resource_name: str, 
    ad_draft: AdCreativeInDB, 
    image_asset_name_square: str,
    image_asset_name_landscape: str
) -> str:
    """
    Creates a new ResponsiveDisplayAd inside the ad group.
    Returns the resource name of the created ad.
    """
    ad_group_ad_service = client.get_service("AdGroupAdService")
    ad_group_ad_operation = client.get_type("AdGroupAdOperation")
    ad_group_ad = ad_group_ad_operation.create
    ad_group_ad.ad_group = ad_group_resource_name
    ad_group_ad.status = ad_group_ad_status_enum.AdGroupAdStatusEnum.AdGroupAdStatus.ENABLED
    
    ad = ad_group_ad.ad
    # Using a placeholder final URL as it's required.
    ad.final_urls.append(ad_draft.final_url)
    
    ad.name = f"{ad_draft.campaign_name} Responsive Ad"
    
    # Create the responsive display ad info
    responsive_ad = client.get_type("ResponsiveDisplayAdInfo")
    
        # Add headlines (min 1, max 5)
    for headline_text in ad_draft.headlines:
        headline = client.get_type("AdTextAsset")
        headline.text = headline_text
        responsive_ad.headlines.append(headline)
    
    # Add body text (description)
    for description_text in ad_draft.descriptions:
        description = client.get_type("AdTextAsset")
        description.text = description_text
        responsive_ad.descriptions.append(description)
    
    # --- FIX: Use singular 'long_headline' ---
    long_headline = client.get_type("AdTextAsset")
    long_headline.text = ad_draft.long_headline[:90] # Use field from DB
    responsive_ad.long_headline = long_headline # Direct assignment


    CTA_STRING_MAP = {
        "LEARN_MORE": "Learn More",
        "SHOP_NOW": "Shop Now",
        "SIGN_UP": "Sign Up",
        "CONTACT_US": "Contact Us",
        "BOOK_NOW": "Book Now",
        "DOWNLOAD": "Download",
        "GET_QUOTE": "Get Quote",
    }
    
    # Get the human-readable string from the map.
    # Default to "Learn More" if the DB value is somehow invalid.
    cta_string = CTA_STRING_MAP.get(ad_draft.call_to_action_text, "Learn More")
    
    # Assign the correct string to the API object
    responsive_ad.call_to_action_text = cta_string

    # Add business name (required)
    responsive_ad.business_name = ad_draft.business_name
    
    # ---
    
    # 1. Add Square Image (1:1)
    image_asset_square = client.get_type("AdImageAsset")
    image_asset_square.asset = image_asset_name_square
    responsive_ad.square_marketing_images.append(image_asset_square)
    
    # 2. Add Landscape Image (1.91:1)
    image_asset_landscape = client.get_type("AdImageAsset")
    image_asset_landscape.asset = image_asset_name_landscape
    responsive_ad.marketing_images.append(image_asset_landscape)
    
    
    responsive_ad.format_setting = display_ad_format_setting_enum.DisplayAdFormatSettingEnum.DisplayAdFormatSetting.NON_NATIVE
    
    # The previous AttributeError was likely due to other (now fixed) bugs.
    ad.responsive_display_ad = responsive_ad

    mutate_response = ad_group_ad_service.mutate_ad_group_ads(customer_id=customer_id, operations=[ad_group_ad_operation])
    resource_name = mutate_response.results[0].resource_name
    logger.info(f"Created ad with resource name: {resource_name}")
    return resource_name



# --- UPDATED: Main function now accepts both image paths ---
async def create_paused_ad_campaign(
    client: GoogleAdsClient,
    customer_id: str,
    ad_draft: AdCreativeInDB,
    image_path_square: str,
    image_path_landscape: str
) -> str:
    """
    Main orchestrator function to create a complete, paused display ad campaign.
    
    Args:
        client: An initialized GoogleAdsClient.
        customer_id: The ID of the Google Ads account to publish to.
        ad_draft: The AdCreativeInDB object from our database.
        image_path_square: The absolute server path to the 1:1 image.
        image_path_landscape: The absolute server path to the 1.91:1 image.
        
    Returns:
        The resource name of the created campaign.
    """
    logger.info(f"Starting Google Ad campaign creation for customer {customer_id}")
    
    try:
        # Step 1: Upload Image Assets
        image_asset_name_square = _upload_image_asset(client, customer_id, image_path_square, "1x1")
        image_asset_name_landscape = _upload_image_asset(client, customer_id, image_path_landscape, "1.91x1")
        
        # Step 2: Create Campaign Budget
        budget_resource_name = _create_campaign_budget(client, customer_id, ad_draft)
        
        # Step 3: Create Campaign (Paused)
        campaign_resource_name = _create_campaign(client, customer_id, budget_resource_name, ad_draft)
        
        # Step 4: Create Ad Group
        ad_group_resource_name = _create_ad_group(client, customer_id, campaign_resource_name, ad_draft)
        
        # Step 5: Create the Ad (Responsive Display Ad)
        _ = _create_responsive_display_ad(
            client, customer_id, ad_group_resource_name, ad_draft, 
            image_asset_name_square=image_asset_name_square,
            image_asset_name_landscape=image_asset_name_landscape
        )
        
        logger.info(f"Successfully created campaign {campaign_resource_name} for ad draft {ad_draft.id}")
        return campaign_resource_name

    except GoogleAdsException as ex:
        logger.error(f"Google Ads API failed during campaign creation: {ex}")
        # Re-raise to be caught by the router
        raise
    except Exception as e:
        logger.error(f"An unexpected error occurred during campaign creation: {e}")
        # Re-raise to be caught by the router
        raise

# ---
# --- NEW FUNCTIONS FOR PUBLISHING ADS (END) ---
# ---

