/**
 * Core TypeScript domain models for ComplyArc
 */

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'compliance_officer' | 'analyst' | 'viewer';
  organization?: string;
  is_active?: boolean;
}

export interface Client {
  id: string;
  name: string;
  type?: 'individual' | 'corporate';
  entity_type?: 'individual' | 'corporate';
  jurisdiction?: string;
  industry?: string;
  product_type?: string;
  interface_type?: string;
  onboarding_channel?: string;
  status: 'active' | 'dormant' | 'suspended' | 'closed';
  risk_level?: 'low' | 'medium' | 'high' | 'critical' | 'unscored' | string;
  risk_score?: number;
  risk_score_total?: number;
  national_id?: string;
  tax_id?: string;
  date_of_birth?: string;
  incorporation_date?: string;
  address?: string;
  notes?: string;
  next_review_date?: string;
  created_at: string;
  updated_at?: string;
}

export interface UBO {
  id: string;
  client_id: string;
  name: string;
  ownership_percent: number;
  nationality?: string;
  date_of_birth?: string;
  is_pep?: boolean;
  is_sanctioned?: boolean;
  risk_flag?: string;
  created_at: string;
}

export interface MatchDetails {
  entity_id: string;
  name: string;
  entity_type: string;
  list_source: string;
  similarity_score: number;
  match_confidence: 'exact' | 'high' | 'medium' | 'low';
  reasons: string[];
}

export interface ScreeningResult {
  screening_id: string;
  query_name: string;
  total_matches: number;
  overall_risk: 'low' | 'medium' | 'high' | 'critical';
  matches: MatchDetails[];
  created_at: string;
}

export interface RiskFactorDetail {
  score?: number;
  factors?: string[];
  description?: string;
}

export interface RiskBreakdown {
  client_id: string;
  client_risk_score?: number;
  geography_risk_score?: number;
  product_risk_score?: number;
  interface_risk_score?: number;
  total_risk_score?: number;
  total_score?: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical' | 'unscored' | string;
  breakdown?: {
    client_risk?: RiskFactorDetail;
    geography_risk?: RiskFactorDetail;
    product_risk?: RiskFactorDetail;
    interface_risk?: RiskFactorDetail;
  };
  factors?: Record<string, number>;
  rationales?: string[];
  version?: number;
  calculated_at?: string;
}

export interface CaseNote {
  id: string;
  case_id: string;
  author_email: string;
  content: string;
  note_type: 'comment' | 'escalation' | 'decision';
  created_at: string;
}

export interface ComplianceCase {
  id: string;
  case_number: string;
  title: string;
  description?: string;
  case_type?: string;
  client_id?: string;
  client_name?: string;
  status: 'open' | 'under_review' | 'escalated' | 'closed' | string;
  priority: 'low' | 'medium' | 'high' | 'critical' | string;
  assigned_to?: string;
  resolution?: string;
  sar_filed?: boolean;
  sar_reference?: string;
  screening_result_id?: string;
  adverse_media_id?: string;
  risk_score?: number;
  notes_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface Alert {
  id: string;
  client_id?: string;
  client?: string;
  type?: string;
  title: string;
  alert_type?: 'sanction_hit' | 'pep_match' | 'adverse_media' | 'risk_spike';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'unread' | 'read' | 'investigating' | 'resolved';
  description?: string;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  actor_email: string;
  action: string;
  resource_type: string;
  resource_id: string;
  extra_metadata?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface SystemSetting {
  key: string;
  value: string;
  description?: string;
  category: string;
  updated_at?: string;
}
