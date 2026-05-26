import httpx
from fastapi import Header, HTTPException, status

from config import get_settings


def get_supabase_headers(token: str) -> dict[str, str]:
    s = get_settings()
    return {
        "Authorization": f"Bearer {token}",
        "apikey": s.supabase_anon_key,
    }


def verify_bearer_token(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )
    return authorization.split(" ", 1)[1].strip()


def get_current_user_id(
    authorization: str | None = Header(default=None),
) -> str:
    token = verify_bearer_token(authorization)
    s = get_settings()
    if not s.supabase_url or not s.supabase_anon_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Backend auth is not configured: set SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env to the same Supabase project as the frontend.",
        )
    url = f"{s.supabase_url.rstrip('/')}/auth/v1/user"
    try:
        r = httpx.get(url, headers=get_supabase_headers(token), timeout=15.0)
    except Exception as exc:
        # Catch httpx.RequestError, ssl.SSLError, httpx.InvalidURL, and any other
        # transport-level exception so it never escapes as an unhandled 500.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to reach authentication service",
        ) from exc
    if r.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        )
    data = r.json()
    uid = data.get("id")
    if not uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session payload",
        )
    return str(uid)
