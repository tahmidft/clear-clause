import logging

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)

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


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Last-resort handler — ensures all 500s are JSON and pass through CORSMiddleware."""
    logger.exception("Unhandled exception for %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected server error occurred. Please try again."},
    )


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


@app.get("/health/config")
def config_check():
    """Non-sensitive diagnostics: which env vars are configured (no values exposed)."""
    s = get_settings()
    try:
        import httpx as _httpx
        r = _httpx.get(f"{s.supabase_url.rstrip('/')}/auth/v1/health", timeout=5.0)
        supabase_reachable = True
        supabase_status = r.status_code
    except Exception as exc:
        supabase_reachable = False
        supabase_status = f"{type(exc).__name__}: {exc}"

    return {
        "supabase_url_set": bool(s.supabase_url),
        "supabase_url_prefix": (s.supabase_url[:20] + "…") if s.supabase_url else None,
        "supabase_anon_key_set": bool(s.supabase_anon_key),
        "supabase_anon_key_prefix": s.supabase_anon_key[:12] + "…" if s.supabase_anon_key else None,
        "gemini_api_key_set": bool(s.gemini_api_key),
        "database_url_set": bool(s.database_url),
        "cors_origins": s.cors_origins,
        "app_env": s.app_env,
        "supabase_auth_reachable": supabase_reachable,
        "supabase_auth_status": supabase_status,
    }
