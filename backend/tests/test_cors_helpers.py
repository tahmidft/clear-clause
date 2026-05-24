from cors_helpers import with_loopback_aliases


def test_loopback_aliases_from_localhost() -> None:
    assert set(with_loopback_aliases(["http://localhost:5173"])) == {
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    }


def test_loopback_aliases_from_ipv4() -> None:
    assert set(with_loopback_aliases(["http://127.0.0.1:5173"])) == {
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    }


def test_loopback_aliases_idempotent() -> None:
    inp = ["http://localhost:5173", "http://127.0.0.1:5173"]
    assert with_loopback_aliases(inp) == inp
