import os

from fastapi.testclient import TestClient


def test_health_has_security_headers() -> None:
    os.environ.setdefault("DATABASE_URL", "postgresql://user:pass@localhost:5432/postgres")
    from main import app

    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert "referrer-policy" in response.headers

