import re
import uuid

from supabase import Client, create_client

from config import get_settings


def get_supabase_admin() -> Client:
    s = get_settings()
    if not s.supabase_url or not s.supabase_service_role_key:
        raise RuntimeError("Supabase URL and service role key are required for storage")
    return create_client(s.supabase_url, s.supabase_service_role_key)


def _safe_filename(name: str) -> str:
    base = name.rsplit("/", 1)[-1]
    base = re.sub(r"[^\w.\-]", "_", base, flags=re.UNICODE)
    return base[:180] if len(base) > 180 else base


def upload_contract_bytes(user_id: str, file_bytes: bytes, filename: str, content_type: str) -> str:
    client = get_supabase_admin()
    bucket = "contracts"
    safe = _safe_filename(filename)
    path = f"{user_id}/{uuid.uuid4()}_{safe}"
    client.storage.from_(bucket).upload(
        path,
        file_bytes,
        {"content-type": content_type},
    )
    public = client.storage.from_(bucket).get_public_url(path)
    return public


def delete_contract_object(file_url: str | None) -> None:
    if not file_url:
        return
    client = get_supabase_admin()
    bucket = "contracts"
    marker = f"/public/{bucket}/"
    if marker not in file_url:
        return
    try:
        object_path = file_url.split(marker, 1)[1].split("?", 1)[0]
    except IndexError:
        return
    if object_path:
        client.storage.from_(bucket).remove([object_path])
