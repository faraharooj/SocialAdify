from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import datetime  # <-- FIX: Import the whole module

class AdInsight(BaseModel):
    id: str
    platform: str
    campaign_name: str
    impressions: int
    clicks: int
    conversions: int
    roi: float
    ctr: float
    engagement_rate: float
    cpc: float
    spend: float
    revenue: float

# --- New Schemas for Meta Page & Post Insights ---

class PageInsightMetrics(BaseModel):
    """
    Represents page-level insights for a single day.
    Metrics are optional as the API might not return all of them.
    """
    date: datetime.date = Field(..., description="The date of the insight data (YYYY-MM-DD).") # <-- FIX: Use datetime.date
    impressions: Optional[int] = Field(None, description="Total impressions for the page on this day.")
    reach: Optional[int] = Field(None, description="Total reach (unique impressions) for the page on this day.")
    engagement: Optional[int] = Field(None, description="Total post engagements for the page on this day.")
    follower_count: Optional[int] = Field(None, description="Total number of followers at the end of this day.")

class PageInsightsResponse(BaseModel):
    """
    The API response for page-level insights, containing a list of daily metrics.
    """
    platform: str = Field(..., description="The platform (e.g., 'facebook' or 'instagram').")
    data: List[PageInsightMetrics] = Field(..., description="A list of daily insight metrics for the requested period.")
    totals: Dict[str, int] = Field(..., description="Total values for key metrics over the period.")


# --- Post Insights (Individual Post Data) ---

class PostReactions(BaseModel):
    """Details of reactions for a single post."""
    like: Optional[int] = 0
    love: Optional[int] = 0
    wow: Optional[int] = 0
    haha: Optional[int] = 0
    sad: Optional[int] = 0
    angry: Optional[int] = 0
    total: Optional[int] = 0

class PostInsight(BaseModel):
    """
    Represents insights for a single post.
    """
    post_id: str = Field(..., description="The ID of the post.")
    platform: str = Field(..., description="The platform (e.g., 'facebook' or 'instagram').")
    created_time: str = Field(..., description="The ISO 8601 timestamp of when the post was created.")
    message: Optional[str] = Field(None, description="The caption or message of the post.")
    
    # Core Metrics
    impressions: Optional[int] = Field(None, description="Total impressions for the post.")
    reach: Optional[int] = Field(None, description="Total reach (unique impressions) for the post.")
    engagement: Optional[int] = Field(None, description="Total number of times a person engaged with the post.")
    comments: Optional[int] = Field(None, description="Total comments on the post.")
    shares: Optional[int] = Field(None, description="Total shares of the post.")
    
    # Reaction details (primarily for Facebook)
    reactions: PostReactions = Field(default_factory=PostReactions, description="Breakdown of reactions.")

class PostInsightsResponse(BaseModel):
    """
    The API response for post-level insights, containing a list of posts with their metrics.
    """
    posts: List[PostInsight] = Field(..., description="A list of posts and their individual insights.")