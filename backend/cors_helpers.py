"""Helpers for browser CORS configuration."""


def with_loopback_aliases(origins: list[str]) -> list[str]:
    """
    For each explicit origin using localhost or 127.0.0.1, also allow the other
    loopback hostname on the same scheme and port. Browsers send the page origin
    literally, so http://127.0.0.1:5173 and http://localhost:5173 are different
    origins and must both be permitted when devs open either URL.
    """
    out: list[str] = []
    seen: set[str] = set()
    for o in origins:
        if o not in seen:
            seen.add(o)
            out.append(o)
        if "://localhost:" in o:
            twin = o.replace("://localhost:", "://127.0.0.1:", 1)
            if twin not in seen:
                seen.add(twin)
                out.append(twin)
        elif "://127.0.0.1:" in o:
            twin = o.replace("://127.0.0.1:", "://localhost:", 1)
            if twin not in seen:
                seen.add(twin)
                out.append(twin)
    return out
