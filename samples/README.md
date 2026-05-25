# Sample contracts for ClearClause

Use these files to demo the product locally or in a portfolio walkthrough. Each variant is available as **DOCX** (upload in the app) and **TXT** (read on GitHub or use in scripts).

## Sample library

| File stem | Purpose | What to expect (default preferences) |
|-----------|---------|--------------------------------------|
| `good-freelance-contract-sample` | Fair freelancer-friendly terms | High score, **accept**, few conflicts |
| `bad-freelance-contract-sample` | Harsh client-favorable terms | Low score, **reject**, many preference conflicts |
| `long-freelance-contract-sample` | Long MSA with many exhibits (~30k chars) | Tests long-document parsing; balanced terms |
| `scam-freelance-contract-sample` | Predatory / scam patterns | **`likely_scam`**, high **scam_risk**, **reject** |
| `freelance-design-contract-sample` | Legacy alias of **bad** | Same as `bad-*` |

Upload any `*-freelance-contract-sample.docx` from the Dashboard (drag & drop or Choose file).

## Bad contract — clause highlights

With **default onboarding preferences**, expect ClearClause to flag:

| Clause area | Why it matters |
|-------------|----------------|
| **Payment (Net 90)** | Conflicts with max payment terms |
| **Unlimited free revisions** | Conflicts if unpaid revisions are off |
| **IP / work made for hire** | Conflicts if you require owning your work |
| **12-month non-compete** | Conflicts if non-compete is off |
| **5-day termination** | Conflicts with minimum notice |
| **Indemnification / unlimited liability** | Often **caution** or **red_flag** |

## Good contract — clause highlights

| Clause area | Typical result |
|-------------|----------------|
| Net 15, 30% deposit | Aligns with payment & deposit prefs |
| Two revision rounds | Within max revision rounds |
| Contractor-friendly IP | License after payment |
| 30-day mutual termination + kill fee | Matches termination prefs |
| Mutual liability caps | Matches liability prefs |

## Scam contract — patterns surfaced

ClearClause runs **rule-based scam detection** in `backend/services/scam_detection.py` (weighted patterns), then merges results with AI clause analysis. The scam sample is written as a realistic predatory agreement with red flags such as:

- Upfront crypto “onboarding fee” before any brief
- Gmail-only contact, no registered company
- Requests for identity / banking credentials
- Impossible 48-hour deadline with penalties
- Payment only in crypto or gift cards

Expect **`likely_scam: true`**, **`scam_risk: high`**, and concrete **`scam_signals`** (crypto upfront fee, credential requests, etc.) — not meta labels about “sample documents.”

Re-analyze contracts uploaded before a logic update (Dashboard → open contract or re-upload) to refresh scores.

## Regenerating samples

From the repo root:

```bash
cd backend && .venv/bin/python ../samples/build_sample_docx.py all
```

Build one variant:

```bash
cd backend && .venv/bin/python ../samples/build_sample_docx.py scam
```

Requires `python-docx` (in `backend/requirements.txt`).

## Database migration (scam fields + new preferences)

If your Supabase project was created from an older `schema.sql`, run:

`supabase/migrations/20260524_scam_and_preferences.sql`

in the Supabase SQL editor before using the new preference fields or scam detection in production.
