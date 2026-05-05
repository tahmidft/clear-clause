export interface Preference {
  unpaid_revisions: boolean;
  payment_terms_days: number;
  ip_ownership: boolean;
  non_compete: boolean;
  termination_notice_days: number;
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

export interface Analysis {
  id: string;
  contract_id: string;
  sections: Section[];
  overall_score: number;
  recommendation: "accept" | "reject";
  recommendation_reason: string;
  preference_conflicts: string[];
  created_at?: string;
}

export type RiskLevel = Section["risk_level"];
