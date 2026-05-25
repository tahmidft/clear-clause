export interface Preference {
  unpaid_revisions: boolean;
  payment_terms_days: number;
  ip_ownership: boolean;
  non_compete: boolean;
  termination_notice_days: number;
  max_revision_rounds: number;
  requires_deposit: boolean;
  min_deposit_percent: number;
  liability_cap_required: boolean;
  accepts_broad_indemnification: boolean;
  kill_fee_required: boolean;
  written_scope_required: boolean;
}

export interface PreferenceRecord extends Preference {
  id: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Contract {
  id: string;
  user_id: string;
  file_name: string;
  storage_path?: string | null;
  file_url: string | null;
  created_at: string;
  analysis?: Analysis | null;
}

export interface Section {
  title: string;
  plain_english: string;
  original_text: string;
  risk_level: "safe" | "caution" | "red_flag";
  risk_reason: string;
  conflicts_with_preference: boolean;
}

export type ScamRisk = "low" | "medium" | "high";

export interface Analysis {
  id: string;
  contract_id: string;
  sections: Section[];
  overall_score: number;
  recommendation: "accept" | "reject";
  recommendation_reason: string;
  preference_conflicts: string[];
  likely_scam: boolean;
  scam_risk: ScamRisk;
  scam_signals: string[];
  created_at?: string;
}

export type RiskLevel = Section["risk_level"];
