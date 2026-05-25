"""Sample contract bodies for ClearClause testing. Written as realistic company agreements."""

from __future__ import annotations

GOOD_SECTIONS: list[tuple[str, str]] = [
    (
        "INDEPENDENT CONTRACTOR AGREEMENT",
        'This Independent Contractor Agreement ("Agreement") is made effective April 15, 2026, by and between '
        "Bright Harbor Studio Inc., a Washington corporation with its principal office at 1200 Pine Street, Suite 400, "
        'Seattle, WA 98101 ("Client"), and Morgan Chen, an individual doing business as Chen UX Studio '
        '("Contractor").',
    ),
    (
        "1. STATEMENT OF WORK",
        "Services are defined in Statement of Work #SOW-BH-2026-08 attached hereto, including user-flow wireframes for "
        "three (3) product areas, a high-fidelity Figma prototype, and a developer handoff package. Changes to scope "
        "require a written change order executed by both parties.",
    ),
    (
        "2. COMPENSATION AND PAYMENT",
        "Total project fee: $12,500 USD. Client shall pay a non-refundable deposit of thirty percent (30%) upon execution. "
        "Forty percent (40%) is due within ten (10) business days of wireframe milestone acceptance. The remaining balance "
        "is due Net fifteen (15) days following final deliverable acceptance. Invoices are payable by ACH to Contractor's "
        "business account listed on Exhibit A. Late amounts accrue interest at one percent (1%) per month.",
    ),
    (
        "3. REVISIONS AND ACCEPTANCE",
        "The project fee includes two (2) consolidated revision rounds per milestone. Additional revisions are billed at "
        "$125 per hour with Client's prior written approval. Client shall provide consolidated feedback within five (5) "
        "business days of delivery or the milestone shall be deemed accepted.",
    ),
    (
        "4. INTELLECTUAL PROPERTY",
        "Upon Client's payment in full, Client receives an exclusive license to use the final deliverables in connection "
        "with its products. Contractor retains ownership of pre-existing materials, tools, and general know-how. Contractor "
        "may display completed work in its portfolio after public launch unless Client objects in writing within fourteen (14) days.",
    ),
    (
        "5. CONFIDENTIALITY",
        "Each party shall protect the other's Confidential Information for three (3) years using reasonable care. Standard "
        "exclusions apply. Contractor may engage subcontractors who have executed confidentiality undertakings, with Client's consent.",
    ),
    (
        "6. NON-SOLICITATION",
        "During the term and for six (6) months thereafter, neither party shall solicit the other's employees whom they met "
        "through this engagement. No non-compete restriction applies to Contractor's other clients.",
    ),
    (
        "7. TERMINATION",
        "Either party may terminate upon thirty (30) days' written notice. If Client terminates without cause, Client shall pay "
        "for accepted milestones plus a kill fee of twenty-five percent (25%) of the remaining fixed fee. Contractor may terminate "
        "if undisputed invoices remain unpaid for more than fifteen (15) days after notice.",
    ),
    (
        "8. INDEMNIFICATION; LIMITATION OF LIABILITY",
        "Each party shall indemnify the other only for third-party claims arising from that party's gross negligence or willful "
        "misconduct. Except for confidentiality breaches, each party's aggregate liability shall not exceed fees paid under this "
        "Agreement during the preceding twelve (12) months.",
    ),
    (
        "9. INDEPENDENT CONTRACTOR",
        "Contractor is an independent contractor responsible for its own taxes, benefits, and insurance. Contractor controls the "
        "manner and means of performing the Services.",
    ),
    (
        "10. GOVERNING LAW",
        "This Agreement is governed by the laws of the State of Washington. Exclusive venue: King County, Washington.",
    ),
    (
        "SIGNATURES",
        "CLIENT: Bright Harbor Studio Inc.\n"
        "By: _________________________  Name: Samuel Okonkwo  Title: VP Product\n\n"
        "CONTRACTOR: Morgan Chen / Chen UX Studio\n"
        "Signature: _________________________  Date: _______________",
    ),
]

BAD_SECTIONS: list[tuple[str, str]] = [
    (
        "INDEPENDENT CONTRACTOR AGREEMENT",
        'This Agreement is entered into March 1, 2026, between Northwind Analytics LLC, a Delaware limited liability company '
        "with offices at 500 Market Street, 12th Floor, San Francisco, CA 94105 (\"Client\"), and Alex Rivera, an independent "
        'design contractor ("Contractor").',
    ),
    (
        "1. SERVICES",
        'Contractor shall perform brand and product design services per Statement of Work #SOW-2026-014, including identity concepts, '
        "social templates, and one (1) marketing landing page design. Contractor performs Services as an independent contractor.",
    ),
    (
        "2. COMPENSATION",
        "Fixed fee: $8,000. Client shall pay within ninety (90) calendar days after written acceptance of final deliverables in "
        "Client's procurement portal. Client may offset disputed amounts against invoices. Late payments accrue 1.5% monthly interest.",
    ),
    (
        "3. REVISIONS",
        "Contractor shall provide unlimited revision cycles at no additional charge until Client's brand director provides written "
        'approval. "Final acceptance" is solely at Client\'s discretion. No payment is due for work-in-progress.',
    ),
    (
        "4. INTELLECTUAL PROPERTY",
        "All Work Product shall be deemed work made for hire. To the extent any Work Product does not qualify, Contractor irrevocably "
        "assigns all worldwide rights to Client, including moral rights where waivable. Contractor may not use Work Product in a "
        "portfolio without separate written approval for each item.",
    ),
    (
        "5. CONFIDENTIALITY",
        "Contractor shall protect Confidential Information for five (5) years and return all materials within three (3) days of termination.",
    ),
    (
        "6. NON-COMPETE",
        "For twelve (12) months post-termination, Contractor shall not provide design services to any SaaS analytics competitor "
        "serving similar customers within fifty (50) miles of San Francisco or via online channels targeting Client's customers.",
    ),
    (
        "7. TERMINATION",
        "Client may terminate for convenience on five (5) days' email notice. Contractor may terminate only for uncured material breach. "
        "Upon termination, Client pays only for deliverables accepted in writing; no kill fee applies.",
    ),
    (
        "8. INDEMNIFICATION",
        "Contractor shall defend and indemnify Client against claims arising from the Services, including alleged infringement, even if "
        "caused in part by Client specifications, except where finally adjudicated as Client's sole gross negligence.",
    ),
    (
        "9. LIMITATION OF LIABILITY",
        "Client liability is capped at fees paid in the prior three (3) months. Contractor liability is unlimited and includes consequential, "
        "incidental, and reputational damages.",
    ),
    (
        "10. GOVERNING LAW",
        "California law governs. Exclusive venue: San Francisco County, California.",
    ),
    (
        "SIGNATURES",
        "CLIENT: Northwind Analytics LLC\n"
        "By: _________________________  Name: Jordan Lee  Title: VP Marketing\n\n"
        "CONTRACTOR: Alex Rivera\n"
        "Signature: _________________________  Date: _______________",
    ),
]

SCAM_SECTIONS: list[tuple[str, str]] = [
    (
        "INDEPENDENT CONTRACTOR AGREEMENT — PRIORITY ENGAGEMENT",
        'This Agreement is offered by Global Brand Nexus ("Client") to the undersigned contractor ("Contractor"), effective upon '
        "Contractor's payment of the onboarding verification amount described in Section 2. Primary contact: "
        "branddirector.nexus@gmail.com.",
    ),
    (
        "1. PROJECT",
        "Contractor is invited to produce a full brand system, marketing website, and mobile UI for a confidential Fortune 500 "
        "end-client that will be disclosed after onboarding. All deliverables are due within forty-eight (48) hours of Contractor's "
        "execution. Failure to meet the deadline voids compensation and triggers a $2,000 administrative penalty payable to Client.",
    ),
    (
        "2. ONBOARDING AND VERIFICATION FEE",
        "Before Client releases the creative brief, Contractor shall pay a refundable verification fee of $750 USD via Bitcoin (BTC) "
        "or USDT to wallet bc1q7nexus8verify9k2m. No ACH, escrow, or corporate invoice is available for onboarding. Fee reimbursement, "
        "if any, is at Client's sole discretion after final approval by offshore counsel.",
    ),
    (
        "3. COMPENSATION",
        "Stated project value: $45,000 USD. Client may remit $500 after onboarding clears; remaining compensation, if approved, will be "
        "paid in cryptocurrency or retail gift cards only. Payment timelines are not guaranteed.",
    ),
    (
        "4. IDENTITY VERIFICATION",
        "Contractor must submit passport image, Social Security Number, mother's maiden name, and online banking login credentials "
        "through Client's compliance portal to receive the statement of work.",
    ),
    (
        "5. INTELLECTUAL PROPERTY",
        "All concepts and files created by Contractor vest in Client immediately upon creation, whether or not payment is made. Contractor "
        "perpetually waives moral rights worldwide.",
    ),
    (
        "6. CONFIDENTIALITY",
        "Contractor may not discuss this engagement with attorneys, advisors, or third parties. Breach incurs $50,000 liquidated damages.",
    ),
    (
        "7. DISPUTE RESOLUTION",
        "Binding arbitration in an unspecified location. Contractor advances all filing and arbitrator fees.",
    ),
    (
        "8. EXECUTION",
        "Contractor accepts by replying YES to the offer email and transmitting the onboarding fee. Typed acceptance is binding. "
        "Client countersignature will be provided only after fee confirmation.",
    ),
]


def long_sections() -> list[tuple[str, str]]:
    base = [
        (
            "MASTER SERVICES AGREEMENT",
            'This Master Services Agreement ("MSA") is dated January 10, 2026 between Orion Enterprise Systems Ltd., '
            "a company organized under the laws of England and Wales with offices at 88 Thames Quay, London E14 9SH, United Kingdom "
            '("Client"), and Taylor Brooks Consulting LLC, a Texas limited liability company with offices at 2200 Congress Avenue, '
            'Suite 1200, Austin, TX 78701 ("Vendor").',
        ),
        (
            "1. SERVICES",
            "Vendor shall perform professional services described in mutually executed Statements of Work, including architecture reviews, "
            "integration design, technical documentation, and up to ten (10) hours of advisory calls per week unless otherwise stated.",
        ),
        (
            "2. FEES AND INVOICING",
            "Fees are specified in each SOW. Unless stated otherwise, payment terms are Net thirty (30) days from invoice date. "
            "Pre-approved expenses over $250 require written consent. Overdue balances accrue 1% monthly interest.",
        ),
        (
            "3. INTELLECTUAL PROPERTY",
            "Each party retains Pre-Existing IP. Deliverables created under a fully paid SOW are assigned to Client. Vendor retains a "
            "non-exclusive license to reuse generalized know-how that does not disclose Client Confidential Information.",
        ),
        (
            "4. CONFIDENTIALITY",
            "Mutual confidentiality obligations survive five (5) years from disclosure. Standard exceptions for independently developed "
            "information and public domain materials apply.",
        ),
        (
            "5. TERM AND TERMINATION",
            "Initial term two (2) years, renewing annually unless either party provides sixty (60) days' notice. Either party may terminate "
            "an SOW for material breach with thirty (30) days to cure.",
        ),
        (
            "6. LIMITATION OF LIABILITY",
            "Except for breaches of confidentiality, indemnity obligations, or willful misconduct, each party's liability is limited to "
            "fees paid under the affected SOW during the prior twelve (12) months. Neither party is liable for consequential damages.",
        ),
        (
            "7. INDEMNIFICATION",
            "Vendor indemnifies Client against third-party IP infringement claims relating to Vendor deliverables, excluding materials "
            "furnished by Client. Client indemnifies Vendor for claims arising from Client's misuse outside the SOW scope.",
        ),
    ]
    exhibits: list[tuple[str, str]] = []
    for i in range(1, 19):
        exhibits.append(
            (
                f"EXHIBIT {i} — OPERATIONAL AND SECURITY REQUIREMENTS",
                f"Exhibit {i} sets service levels for workstream {i}, including weekly status reporting, change logs, and documented "
                f"runbooks. Vendor shall comply with Client Information Security Standard v4.{i} (encryption at rest, MFA for privileged "
                "access, annual penetration test summary). Client may schedule up to two (2) on-site workshops per calendar quarter with "
                "thirty (30) days' notice. Subcontractors require prior written approval and must execute Client's subcontractor agreement. "
                "Vendor maintains commercial general liability ($1,000,000 per occurrence) and professional liability ($2,000,000 aggregate). "
                f"Milestone {i} acceptance requires signed UAT, operations handoff, and knowledge-transfer session. If Vendor misses a "
                "milestone by more than ten (10) business days, Client may withhold up to fifteen percent (15%) of that milestone pending cure. "
                "Notices: legal-notices@orion-enterprise.co.uk and legal@taylorbrooksconsulting.com. Disputes: escalation, mediation in "
                "Chicago, Illinois, then courts of Cook County, Illinois.",
            ),
        )
    signatures = (
        "IN WITNESS WHEREOF",
        "ORION ENTERPRISE SYSTEMS LTD.\nAuthorized Signatory: _________________________  Date: _______________\n\n"
        "TAYLOR BROOKS CONSULTING LLC\nAuthorized Signatory: _________________________  Date: _______________",
    )
    return base + exhibits + [signatures]


VARIANTS: dict[str, list[tuple[str, str]]] = {
    "good": GOOD_SECTIONS,
    "bad": BAD_SECTIONS,
    "scam": SCAM_SECTIONS,
    "long": long_sections(),
}

LEGACY_ALIASES = {
    "freelance-design": "bad",
}
