// ── Enums (using const / types for erasableSyntax compatibility) ──────────────

export const ServiceType = {
  PASSPORT: 'passport',
  DRIVING_LICENSE: 'driving_license',
  GST_REGISTRATION: 'gst_registration',
  INCOME_CERTIFICATE: 'income_certificate',
  CASTE_CERTIFICATE: 'caste_certificate',
  BIRTH_CERTIFICATE: 'birth_certificate',
  LAND_REGISTRATION: 'land_registration',
} as const;
export type ServiceType = typeof ServiceType[keyof typeof ServiceType];

export const StageType = {
  SUBMISSION: 'submission',
  DOCUMENT_VERIFICATION: 'document_verification',
  FIELD_VERIFICATION: 'field_verification',
  APPROVAL: 'approval',
  ISSUANCE: 'issuance',
} as const;
export type StageType = typeof StageType[keyof typeof StageType];

export const PriorityMode = {
  BALANCED: 'balanced',
  URGENT_FIRST: 'urgent_first',
  OLDEST_FIRST: 'oldest_first',
  BACKLOG_CLEARANCE: 'backlog_clearance',
} as const;
export type PriorityMode = typeof PriorityMode[keyof typeof PriorityMode];

export const ActionType = {
  SET_PRIORITY_MODE: 'set_priority_mode',
  ASSIGN_CAPACITY: 'assign_capacity',
  REQUEST_MISSING_DOCUMENTS: 'request_missing_documents',
  ESCALATE_SERVICE: 'escalate_service',
  ADVANCE_TIME: 'advance_time',
  REALLOCATE_OFFICERS: 'reallocate_officers',
} as const;
export type ActionType = typeof ActionType[keyof typeof ActionType];

export const AgentType = {
  LLM: 'llm',
  HEURISTIC: 'heuristic',
} as const;
export type AgentType = typeof AgentType[keyof typeof AgentType];

export type TaskId = 'district_backlog_easy' | 'mixed_urgency_medium' | 'cross_department_hard';
export type TaskSelection = TaskId | 'all';

// ── Data Models ──────────────────────────────────────────────────────────────

export interface OfficerPool {
  allocations: Record<string, number>;
  reserve_officers: number;
}

export interface QueueSnapshot {
  service: ServiceType;
  stage_counts: Record<string, number>;
  active_cases: number;
  missing_docs_cases: number;
  escalated_cases: number;
  urgent_cases: number;
  breached_cases: number;
  avg_age_days: number;
}

export interface ObservationModel {
  task_id: string;
  day: number;
  max_days: number;
  priority_mode: PriorityMode;
  officer_pool: OfficerPool;
  queue_snapshots: QueueSnapshot[];
  total_backlog: number;
  total_completed: number;
  total_sla_breaches: number;
  fairness_gap: number;
  escalation_budget_remaining: number;
  last_action_valid: boolean;
  last_action_message: string;
}

export interface ActionModel {
  action_type: ActionType;
  priority_mode?: PriorityMode | null;
  service?: ServiceType | null;
  target_service?: ServiceType | null;
  case_id?: string | null;
  officer_delta?: number;
  notes?: string | null;
}

export interface RewardModel {
  total_reward: number;
  progress_reward: number;
  completion_reward: number;
  waiting_penalty: number;
  sla_penalty: number;
  fairness_penalty: number;
  invalid_action_penalty: number;
  idle_capacity_penalty: number;
}

export interface StepInfoModel {
  reward_breakdown: RewardModel;
  newly_arrived_cases: number;
  newly_completed_cases: number;
  invalid_action: boolean;
  grader_preview_score: number | null;
  notes: string[];
}

export interface EpisodeMetricsModel {
  total_arrived: number;
  total_completed: number;
  total_sla_breaches: number;
  total_invalid_actions: number;
  total_docs_requested: number;
  total_docs_cleared: number;
  total_urgent_arrived: number;
  total_urgent_completed: number;
  total_escalations_used: number;
  total_wasted_escalations: number;
  total_idle_officer_days: number;
  total_capacity_days: number;
}

export interface EpisodeStateModel {
  episode_id: string;
  seed: number;
  task_id: string;
  day: number;
  terminated: boolean;
  truncated: boolean;
  total_steps: number;
  total_completed: number;
  total_backlog: number;
  total_sla_breaches: number;
  action_history_count: number;
  fairness_gap: number;
  escalation_budget_remaining: number;
  priority_mode: PriorityMode;
  metrics: EpisodeMetricsModel;
  action_history: Record<string, unknown>[];
}

// ── API Payloads ─────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: string;
  version: string;
  active_sessions: number;
  available_tasks: string[];
}

export interface ResetRequest {
  task_id?: string;
  seed?: number;
  options?: Record<string, unknown>;
}

export interface ResetResponse {
  session_id: string;
  observation: ObservationModel;
  info: Record<string, unknown>;
}

export interface StepRequest {
  session_id: string;
  action: ActionModel;
}

export interface StepResponse {
  session_id: string;
  observation: ObservationModel;
  reward: number;
  terminated: boolean;
  truncated: boolean;
  info: StepInfoModel;
}

export interface StateRequest {
  session_id: string;
  include_action_history?: boolean;
}

export interface StateResponse {
  session_id: string;
  state: EpisodeStateModel;
}

export interface GradeRequest {
  session_id: string;
}

export interface GradeResponse {
  session_id: string;
  score: number;
  grader_name: string;
  metrics: Record<string, number>;
}

export interface SessionListResponse {
  active_sessions: number;
  session_ids: string[];
}

export interface DeleteSessionResponse {
  deleted: string;
}

// ── Client-Side Types ────────────────────────────────────────────────────────

export interface TimeSeriesPoint {
  day: number;
  value: number;
}

export interface EpisodeRun {
  id: string;
  taskId: TaskId;
  seed: number;
  score: number;
  graderName: string;
  metrics: Record<string, number>;
  totalSteps: number;
  totalReward: number;
  totalCompleted: number;
  totalBacklog: number;
  totalSlaBreach: number;
  fairnessGap: number;
  terminated: boolean;
  truncated: boolean;
  timestamp: number;
  backlogSeries: TimeSeriesPoint[];
  rewardSeries: any[];
}
