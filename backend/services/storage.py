import re
import uuid

import httpx

from config import get_settings

BUCKET = "contracts"


def _storage_settings() -> tuple[str, str]:
    s = get_settings()
    if not s.supabase_url or not s.supabase_service_role_key:
        raise RuntimeError("Supabase URL and service role key are required for storage")
    return s.supabase_url.rstrip("/"), s.supabase_service_role_key


def _storage_headers(key: str, content_type: str | None = None) -> dict[str, str]:
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    if content_type:
        headers["Content-Type"] = content_type
    return headers


def _safe_filename(name: str) -> str:
    base = name.rsplit("/", 1)[-1]
    base = re.sub(r"[^\w.\-]", "_", base, flags=re.UNICODE)
    return base[:180] if len(base) > 180 else base


def upload_contract_bytes(user_id: str, file_bytes: bytes, filename: str, content_type: str) -> tuple[str, str]:
    base_url, key = _storage_settings()
    safe = _safe_filename(filename)
    path = f"{user_id}/{uuid.uuid4()}_{safe}"
    upload_url = f"{base_url}/storage/v1/object/{BUCKET}/{path}"

    with httpx.Client(timeout=60.0) as client:
        res = client.post(
            upload_url,
            headers=_storage_headers(key, content_type),
            content=file_bytes,
        )
        if res.status_code not in (200, 201):
            detail = res.text.strip()[:300] or res.reason_phrase
            if res.status_code == 404 and "Bucket not found" in detail:
                raise RuntimeError(
                    f'Storage bucket "{BUCKET}" not found. Create a public bucket named "{BUCKET}" in Supabase → Storage.'
                ) from None
            raise RuntimeError(f"Storage upload failed ({res.status_code}): {detail}")

    public = f"{base_url}/storage/v1/object/public/{BUCKET}/{path}"
    return path, public


def delete_contract_object(storage_path: str | None, file_url: str | None = None) -> None:
    if not storage_path and not file_url:
        return
    base_url, key = _storage_settings()
    object_path = storage_path or ""
    if not object_path and file_url:
        marker = f"/public/{BUCKET}/"
        if marker in file_url:
            try:
                object_path = file_url.split(marker, 1)[1].split("?", 1)[0]
            except IndexError:
                object_path = ""
        marker2 = f"/object/{BUCKET}/"
        if not object_path and marker2 in file_url:
            try:
                object_path = file_url.split(marker2, 1)[1].split("?", 1)[0]
            except IndexError:
                object_path = ""
    if not object_path:
        return

    delete_url = f"{base_url}/storage/v1/object/{BUCKET}/{object_path}"
    with httpx.Client(timeout=30.0) as client:
        res = client.delete(delete_url, headers=_storage_headers(key))
        if res.status_code not in (200, 204) and res.status_code != 404:
            detail = res.text.strip()[:200] or res.reason_phrase
            raise RuntimeError(f"Storage delete failed ({res.status_code}): {detail}")
