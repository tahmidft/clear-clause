export type RiskLevel = "safe" | "caution" | "danger";

export type ContractSection = {
  id: string;
  title: string;
  summary: string;
  risk: RiskLevel;
  original: string;
  conflictsWith?: string[]; // preference keys
};

export type Contract = {
  id: string;
  name: string;
  client: string;
  date: string;
  score: number; // 0-100
  status: "pending" | "accepted" | "rejected";
  sections: ContractSection[];
};

export const PREFERENCES = [
  { key: "unpaid_revisions", label: "No unpaid revisions", desc: "Flag clauses requiring unlimited free changes." },
  { key: "late_payment", label: "Strict payment terms", desc: "Flag NET-60+ or unclear payment timelines." },
  { key: "ip_ownership", label: "Retain IP until paid", desc: "Flag clauses transferring IP before final payment." },
  { key: "non_compete", label: "No non-competes", desc: "Flag exclusivity or non-compete clauses." },
  { key: "termination_notice", label: "Fair termination notice", desc: "Require at least 14 days notice." },
] as const;

export const SAMPLE_CONTRACTS: Contract[] = [
  {
    id: "c1",
    name: "Brand Identity Project — Northwind Co.",
    client: "Northwind Co.",
    date: "2026-04-28",
    score: 42,
    status: "pending",
    sections: [
      {
        id: "s1", title: "Payment Terms", risk: "danger",
        summary: "Client pays NET-60 after final delivery, with a 5% discount for early sign-off.",
        original: "Payment shall be made within sixty (60) days following acceptance of the final deliverables by the Client...",
        conflictsWith: ["late_payment"],
      },
      {
        id: "s2", title: "IP Rights", risk: "danger",
        summary: "All intellectual property transfers to the Client immediately upon contract signing.",
        original: "Upon execution of this Agreement, all right, title, and interest in the Work Product shall vest in the Client...",
        conflictsWith: ["ip_ownership"],
      },
      {
        id: "s3", title: "Termination Clause", risk: "caution",
        summary: "Client may terminate with 7 days notice. No kill fee specified.",
        original: "Either party may terminate this Agreement upon seven (7) days written notice...",
        conflictsWith: ["termination_notice"],
      },
      {
        id: "s4", title: "Revision Policy", risk: "caution",
        summary: "Includes 3 revision rounds; further rounds billed at standard rate.",
        original: "The Contractor shall provide up to three (3) rounds of revisions at no additional cost...",
      },
      {
        id: "s5", title: "Non-Compete", risk: "safe",
        summary: "No non-compete or exclusivity restrictions imposed.",
        original: "Nothing in this Agreement shall restrict the Contractor from working with other clients...",
      },
      {
        id: "s6", title: "Liability", risk: "caution",
        summary: "Liability capped at total project fees — reasonable but worth noting.",
        original: "In no event shall either party's aggregate liability exceed the total fees paid under this Agreement...",
      },
    ],
  },
  {
    id: "c2",
    name: "Website Redesign — Lumen Studio",
    client: "Lumen Studio",
    date: "2026-04-21",
    score: 86,
    status: "accepted",
    sections: [
      { id: "s1", title: "Payment Terms", risk: "safe", summary: "50% upfront, 50% on delivery. NET-14.", original: "Client agrees to pay 50% upon signing and remaining 50% within fourteen (14) days of delivery..." },
      { id: "s2", title: "IP Rights", risk: "safe", summary: "IP transfers upon final payment.", original: "Ownership of deliverables transfers to Client upon receipt of final payment in full..." },
      { id: "s3", title: "Termination Clause", risk: "safe", summary: "30 days written notice with kill fee.", original: "Either party may terminate with thirty (30) days written notice..." },
      { id: "s4", title: "Revision Policy", risk: "safe", summary: "2 rounds included, additional billed hourly.", original: "Two (2) revision rounds included..." },
      { id: "s5", title: "Non-Compete", risk: "safe", summary: "None.", original: "No non-compete restrictions." },
      { id: "s6", title: "Liability", risk: "safe", summary: "Mutual liability cap at fees paid.", original: "Mutual limitation of liability..." },
    ],
  },
  {
    id: "c3",
    name: "Content Strategy Retainer — Helix Labs",
    client: "Helix Labs",
    date: "2026-04-12",
    score: 28,
    status: "rejected",
    sections: [
      { id: "s1", title: "Payment Terms", risk: "danger", summary: "NET-90 with no late fees.", original: "...within ninety (90) days of invoice date.", conflictsWith: ["late_payment"] },
      { id: "s2", title: "IP Rights", risk: "danger", summary: "Work-for-hire from inception.", original: "All work shall be deemed work made for hire...", conflictsWith: ["ip_ownership"] },
      { id: "s3", title: "Termination Clause", risk: "danger", summary: "Client may terminate immediately, no kill fee.", original: "Client may terminate immediately for any reason...", conflictsWith: ["termination_notice"] },
      { id: "s4", title: "Revision Policy", risk: "danger", summary: "Unlimited revisions until client approval.", original: "Contractor shall provide unlimited revisions until Client is fully satisfied...", conflictsWith: ["unpaid_revisions"] },
      { id: "s5", title: "Non-Compete", risk: "danger", summary: "12-month non-compete in industry.", original: "Contractor shall not provide similar services to competitors for twelve (12) months...", conflictsWith: ["non_compete"] },
      { id: "s6", title: "Liability", risk: "caution", summary: "Unlimited indemnification of Client.", original: "Contractor shall indemnify and hold Client harmless from any and all claims..." },
    ],
  },
];

export function riskCopy(r: RiskLevel) {
  if (r === "safe") return { label: "Safe", tone: "success" as const };
  if (r === "caution") return { label: "Caution", tone: "warning" as const };
  return { label: "Red flag", tone: "destructive" as const };
}
