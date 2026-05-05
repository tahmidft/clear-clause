from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from routers import analysis, contracts, preferences

app = FastAPI(title="ClearClause API")

settings = get_settings()
_origins = (settings.cors_origins or "*").strip()
if _origins == "*":
    allow_origins = ["*"]
    allow_credentials = False
else:
    allow_origins = [o.strip() for o in _origins.split(",") if o.strip()]
    allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(contracts.router, prefix="/contracts", tags=["contracts"])
app.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
app.include_router(preferences.router, prefix="/preferences", tags=["preferences"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
