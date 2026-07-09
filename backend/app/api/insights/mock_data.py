# D:\socialadify\backend\app\api\insights\mock_data.py
# --- Mock Campaign 1 (The original one - EFFICIENT) ---
MOCK_GOOGLE_CAMPAIGN_1 = {
    "id": "MOCK-GOOGLE-CAMPAIGN-123",
    "name": "SocialAdify Showcase Campaign",
    "status": "ENABLED",
    "clicks": 135, "impressions": 0, "ctr": 0.0, "average_cpc": 0.0, "cost": 0.0,
}

MOCK_CAMPAIGN_PERFORMANCE_1 = {
    "campaign_id": "MOCK-GOOGLE-CAMPAIGN-123",
    "campaign_name": "SocialAdify Showcase Campaign",
    "status": "ENABLED",
    "performance_data": [
        {"date": "2025-11-20", "impressions": 1550, "clicks": 75, "cost_micros": 1500000},
        {"date": "2025-11-21", "impressions": 1620, "clicks": 81, "cost_micros": 1650000},
        {"date": "2025-11-22", "impressions": 1480, "clicks": 68, "cost_micros": 1400000},
        {"date": "2025-11-23", "impressions": 1750, "clicks": 95, "cost_micros": 1900000},
        {"date": "2025-11-24", "impressions": 1800, "clicks": 105, "cost_micros": 2150000},
        {"date": "2025-11-25", "impressions": 1950, "clicks": 120, "cost_micros": 2400000},
        {"date": "2025-11-26", "impressions": 2100, "clicks": 135, "cost_micros": 2650000},
    ]
}

# --- EDITED: Mock Campaign 2 (Now represents an INEFFICIENT campaign) ---
MOCK_GOOGLE_CAMPAIGN_2 = {
    "id": "MOCK-GOOGLE-CAMPAIGN-456",
    "name": "Q4 Sales Push",
    "status": "ENABLED",
    "clicks": 62, "impressions": 0, "ctr": 0.0, "average_cpc": 0.0, "cost": 0.0,
}

MOCK_CAMPAIGN_PERFORMANCE_2 = {
    "campaign_id": "MOCK-GOOGLE-CAMPAIGN-456",
    "campaign_name": "Q4 Sales Push",
    "status": "ENABLED",
    "performance_data": [
        # This campaign now has high impressions and cost, but very low clicks.
        # This indicates the ad is being shown a lot but isn't compelling enough to click.
        {"date": "2025-11-10", "impressions": 2500, "clicks": 10, "cost_micros": 2500000},
        {"date": "2025-11-11", "impressions": 2600, "clicks": 8, "cost_micros": 2800000},
        {"date": "2025-11-12", "impressions": 2400, "clicks": 7, "cost_micros": 2600000},
        {"date": "2025-11-13", "impressions": 2800, "clicks": 12, "cost_micros": 3000000},
        {"date": "2025-11-14", "impressions": 2900, "clicks": 9, "cost_micros": 3200000},
        {"date": "2025-11-15", "impressions": 3000, "clicks": 11, "cost_micros": 3500000},
        {"date": "2025-11-16", "impressions": 3200, "clicks": 5, "cost_micros": 3800000},
    ]
}

# --- ADDED: Mock Campaign 3 (Meta Campaign) ---
MOCK_META_CAMPAIGN_1 = {
    "id": "MOCK-META-CAMPAIGN-789",
    "name": "Meta Test Ad",
    "status": "PAUSED", 
    "clicks": 88, # This will show "88 Clicks" in the list
    "impressions": 5000, 
    "ctr": 9.9, 
    "average_cpc": 5.5, 
    "cost": 6.0,
}

# --- ADDED: Mock Performance Data for Meta Campaign ---
MOCK_CAMPAIGN_PERFORMANCE_3 = {
    "campaign_id": "MOCK-META-CAMPAIGN-789",
    "campaign_name": "Meta Test Ad",
    "status": "PAUSED",
    "performance_data": [
        # This campaign has good impressions but average clicks
        {"date": "2025-11-20", "impressions": 2400, "clicks": 22, "cost_micros": 2400000},
        {"date": "2025-11-21", "impressions": 2000, "clicks": 10, "cost_micros": 2000000},
        {"date": "2025-11-22", "impressions": 2100, "clicks": 15, "cost_micros": 2100000},
        {"date": "2025-11-23", "impressions": 1900, "clicks": 12, "cost_micros": 1900000},
        {"date": "2025-11-24", "impressions": 2200, "clicks": 18, "cost_micros": 2200000},
        {"date": "2025-11-25", "impressions": 2300, "clicks": 20, "cost_micros": 2300000},
        {"date": "2025-11-26", "impressions": 2050, "clicks": 13, "cost_micros": 2050000},
        
    ]
}