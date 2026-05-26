import os

from fastapi.testclient import TestClient


def _make_client():
    os.environ.setdefault("DATABASE_URL", "postgresql://user:pass@localhost:5432/postgres")
    from main import app
    return TestClient(app)


def test_health_has_security_headers() -> None:
    client = _make_client()
    response = client.get("/health")
    assert response.status_code == 200
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert "referrer-policy" in response.headers


def test_contracts_with_bearer_returns_json_not_plain_text(monkeypatch) -> None:
    """Any Bearer token must return a JSON response (not plain-text 500) with CORS headers.

    Regression: httpx.get() can raise exceptions beyond httpx.RequestError (e.g. ssl.SSLError,
    httpx.InvalidURL). These were previously uncaught, escaping FastAPI's handlers and causing
    Starlette's ServerErrorMiddleware to return 'Internal Server Error' as plain text with no
    CORS headers. The browser sees this as a network error (status 0).
    """
    import httpx

    # Simulate any non-RequestError exception from httpx.get
    def boom(*_args, **_kwargs):
        raise RuntimeError("simulated ssl/transport failure")

    monkeypatch.setattr(httpx, "get", boom)

    client = _make_client()
    response = client.get(
        "/contracts",
        headers={
            "Authorization": "Bearer some.jwt.token",
            "Origin": "https://clearclause.vercel.app",
        },
    )
    # Must never be plain-text 500; must be a JSON error response.
    assert response.status_code in (401, 422, 503, 500), response.text
    assert response.headers.get("content-type", "").startswith("application/json"), (
        f"Expected JSON response, got content-type={response.headers.get('content-type')!r}, "
        f"body={response.text!r}"
    )

