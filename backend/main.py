from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from cors_helpers import with_loopback_aliases
from config import get_settings
from db_errors import http_exception_from_sqlalchemy
from routers import analysis, contracts, preferences

app = FastAPI(title="ClearClause API")

settings = get_settings()
_origins = (settings.cors_origins or "*").strip()
if _origins == "*":
    allow_origins = ["*"]
    allow_credentials = False
else:
    allow_origins = with_loopback_aliases([o.strip() for o in _origins.split(",") if o.strip()])
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


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_error_handler(_request: Request, exc: SQLAlchemyError) -> JSONResponse:
    http_exc = http_exception_from_sqlalchemy(exc, context="processing your request")
    return JSONResponse(status_code=http_exc.status_code, content={"detail": http_exc.detail})


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if settings.app_env.lower() in {"production", "prod"}:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    return response


@app.get("/health")
def health_check():
    return {"status": "ok"}
