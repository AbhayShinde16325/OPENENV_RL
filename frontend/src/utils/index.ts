export const SERVICE_LABELS: Record<string, string> = {
  passport: 'Passport',
  driving_license: 'Driving License',
  gst_registration: 'GST Registration',
  income_certificate: 'Income Certificate',
  caste_certificate: 'Caste Certificate',
  birth_certificate: 'Birth Certificate',
  land_registration: 'Land Registration',
};

export const STAGE_LABELS: Record<string, string> = {
  submission: 'Submission',
  document_verification: 'Doc Verify',
  field_verification: 'Field Verify',
  approval: 'Approval',
  issuance: 'Issuance',
};

export const PRIORITY_LABELS: Record<string, string> = {
  balanced: 'Balanced',
  urgent_first: 'Urgent First',
  oldest_first: 'Oldest First',
  backlog_clearance: 'Backlog Clearance',
};

export const ACTION_LABELS: Record<string, string> = {
  set_priority_mode: 'Set Priority',
  assign_capacity: 'Assign Capacity',
  request_missing_documents: 'Resolve Docs',
  escalate_service: 'Escalate',
  advance_time: 'Advance Time',
  reallocate_officers: 'Reallocate',
};

export const CHART_COLORS = {
  amber: '#f59e0b',
  emerald: '#10b981',
  rose: '#f43f5e',
  sky: '#0ea5e9',
  violet: '#8b5cf6',
  navy: '#64748b',
  orange: '#f97316',
  teal: '#14b8a6',
};

export function formatServiceId(s: string): string {
  return SERVICE_LABELS[s] ?? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function formatScore(n: number | null | undefined): string {
  if (n == null) return '—';
  return (n * 100).toFixed(1) + '%';
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toLocaleString();
}

export function formatReward(n: number): string {
  return n >= 0 ? `+${n.toFixed(2)}` : n.toFixed(2);
}
