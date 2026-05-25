# Supabase Storage — `contracts` bucket

The API uploads files with the **service role / secret** key (`sb_secret_…` in `backend/.env`).

## Dashboard setup

1. Open **Storage** in the Supabase dashboard.
2. Create a bucket named **`contracts`** (exact name).
3. Set the bucket to **Public** so stored `file_url` values work for downloads and deletion.
4. No extra MIME policy is required; the API accepts PDF and DOCX up to 10 MB.

## Verify from the repo

```bash
bash scripts/verify-storage.sh
```

## Policies (optional)

For server-side uploads with the secret key, RLS on storage is bypassed. If you use the anon key from the browser later, add policies that restrict paths to `auth.uid()`.
