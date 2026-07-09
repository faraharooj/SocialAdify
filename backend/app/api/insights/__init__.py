from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_dummy_insight():
    return {"message": "Dummy Insight Data"}
