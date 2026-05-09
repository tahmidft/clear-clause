import pytest
from fastapi import HTTPException

from security import FixedWindowRateLimiter


def test_rate_limiter_allows_within_limit() -> None:
    limiter = FixedWindowRateLimiter()
    limiter.check("u1", 2)
    limiter.check("u1", 2)


def test_rate_limiter_blocks_over_limit() -> None:
    limiter = FixedWindowRateLimiter()
    limiter.check("u1", 1)
    with pytest.raises(HTTPException) as exc:
        limiter.check("u1", 1)
    assert exc.value.status_code == 429

