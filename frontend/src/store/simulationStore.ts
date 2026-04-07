import { create } from 'zustand';
import type { ObservationModel, ActionModel, StepInfoModel, EpisodeRun, TaskId } from '../types';
const storedRuns = localStorage.getItem('gov_episode_runs');

interface EpisodeRunDraft {
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
  backlogSeries: { day: number; backlog: number }[];
}

interface SimulationState {
  // Session / Execution
  sessionId: string | null;
  observation: ObservationModel | null;
  reward: number;
  cumulativeReward: number;
  terminated: boolean;
  truncated: boolean;
  stepCount: number;
  isSmartRunning: boolean;
  
  // Configuration
  taskId: TaskId;
  seed: string;
  stepsInput: string;

  // History & Logs
  terminalLogs: string[];
  actionLog: {
    step: number;
    day: number;
    action: ActionModel;
    reward: number;
    invalid: boolean;
    message: string;
    modelUsed?: string;
  }[];
  
  // Series for Charts
  backlogSeries: { day: number; backlog: number }[];
  arrivalCompletionSeries: { day: number; arrivals: number; completions: number }[];
  slaSeries: { day: number; breaches: number }[];
  rewardSeries: { step: number; progress: number; completion: number; waiting: number; sla: number; fairness: number; idle: number }[];
  fairnessSeries: { day: number; gap: number }[];
  
  // Reports
  episodeRuns: EpisodeRun[];
  error: string | null;
  runRequestId: number;
  resetRequestId: number;

  // Actions
  setSession: (id: string | null, obs: ObservationModel | null) => void;
  updateState: (obs: ObservationModel, reward: number, terminated: boolean, truncated: boolean, info: StepInfoModel, action: ActionModel, modelUsed?: string) => void;
  resetSession: () => void;
  saveEpisodeRun: (score: number, graderName: string, metrics: Record<string, number>) => void;
  saveEpisodeRunDraft: (draft: EpisodeRunDraft) => void;
  setError: (msg: string | null) => void;
  
  // Config Actions
  setTaskId: (tid: TaskId) => void;
  setSeed: (s: string) => void;
  setStepsInput: (value: string) => void;
  setIsSmartRunning: (r: boolean) => void;
  requestRun: () => void;
  requestReset: () => void;
  
  // Log Actions
  appendLog: (msg: string) => void;
  clearLogs: () => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  sessionId: null,
  observation: null,
  reward: 0,
  cumulativeReward: 0,
  terminated: false,
  truncated: false,
  stepCount: 0,
  isSmartRunning: false,

  taskId: 'district_backlog_easy' as TaskId,
  seed: 'auto',
  stepsInput: '10',

  terminalLogs: [],
  actionLog: [],
  backlogSeries: [],
  arrivalCompletionSeries: [],
  slaSeries: [],
  rewardSeries: [],
  fairnessSeries: [],
  episodeRuns: JSON.parse(storedRuns || '[]'),
  error: null,
  runRequestId: 0,
  resetRequestId: 0,

  setSession: (id, obs) => set({
    sessionId: id,
    observation: obs,
    terminated: false,
    truncated: false,
    stepCount: 0,
    reward: 0,
    cumulativeReward: 0,
    actionLog: [],
    backlogSeries: [],
    arrivalCompletionSeries: [],
    slaSeries: [],
    rewardSeries: [],
    fairnessSeries: [],
    terminalLogs: []
  }),

  updateState: (obs, reward, terminated, truncated, info, action, modelUsed) => set((state) => {
    const stepNum = state.stepCount + 1;
    const newCumulative = state.cumulativeReward + reward;
    
    // Log entry
    const logEntry = {
      step: stepNum,
      day: obs.day,
      action,
      reward,
      invalid: info.invalid_action,
      message: info.notes.join(', '),
      modelUsed
    };

    // Derived data for charts
    const backlogSeries = [...state.backlogSeries];
    if (!backlogSeries.find(b => b.day === obs.day)) {
      backlogSeries.push({ day: obs.day, backlog: obs.total_backlog });
    }

    const arrivalCompletionSeries = [...state.arrivalCompletionSeries];
    if (!arrivalCompletionSeries.find(a => a.day === obs.day)) {
      arrivalCompletionSeries.push({
        day: obs.day,
        arrivals: info.newly_arrived_cases || 0,
        completions: info.newly_completed_cases || 0,
      });
    }

    const slaSeries = [...state.slaSeries];
    if (!slaSeries.find(s => s.day === obs.day)) {
      slaSeries.push({ day: obs.day, breaches: obs.total_sla_breaches });
    }

    const fairnessSeries = [...state.fairnessSeries];
    if (!fairnessSeries.find(f => f.day === obs.day)) {
      fairnessSeries.push({ day: obs.day, gap: obs.fairness_gap });
    }

    const rewardSeries = [...state.rewardSeries, {
      step: stepNum,
      progress: info.reward_breakdown.progress_reward,
      completion: info.reward_breakdown.completion_reward,
      waiting: -info.reward_breakdown.waiting_penalty,
      sla: -info.reward_breakdown.sla_penalty,
      fairness: -info.reward_breakdown.fairness_penalty,
      idle: -info.reward_breakdown.idle_capacity_penalty,
    }].slice(-50);

    return {
      observation: obs,
      reward,
      cumulativeReward: newCumulative,
      terminated,
      truncated,
      stepCount: stepNum,
      actionLog: [...state.actionLog, logEntry],
      backlogSeries,
      arrivalCompletionSeries,
      slaSeries,
      rewardSeries,
      fairnessSeries
    };
  }),

  resetSession: () => set({
    sessionId: null,
    observation: null,
    terminated: false,
    truncated: false,
    stepCount: 0,
    reward: 0,
    cumulativeReward: 0,
    actionLog: [],
    backlogSeries: [],
    arrivalCompletionSeries: [],
    slaSeries: [],
    rewardSeries: [],
    fairnessSeries: [],
    terminalLogs: [],
    isSmartRunning: false
  }),

  saveEpisodeRun: (score, graderName, metrics) => set((state) => {
    const run: EpisodeRun = {
      id: crypto.randomUUID(),
      taskId: state.taskId,
      seed: state.seed === 'auto' ? 0 : parseInt(state.seed),
      score,
      graderName,
      metrics,
      totalSteps: state.stepCount,
      totalReward: state.cumulativeReward,
      totalCompleted: state.observation?.total_completed || 0,
      totalBacklog: state.observation?.total_backlog || 0,
      totalSlaBreach: state.observation?.total_sla_breaches || 0,
      fairnessGap: state.observation?.fairness_gap || 0,
      terminated: state.terminated,
      truncated: state.truncated,
      timestamp: Date.now(),
      backlogSeries: state.backlogSeries.map(b => ({ day: b.day, value: b.backlog })),
      rewardSeries: [],
    };
    const newRuns = [run, ...state.episodeRuns].slice(0, 50);
    localStorage.setItem('gov_episode_runs', JSON.stringify(newRuns));
    return { episodeRuns: newRuns };
  }),

  saveEpisodeRunDraft: (draft) => set((state) => {
    const run: EpisodeRun = {
      id: crypto.randomUUID(),
      taskId: draft.taskId,
      seed: draft.seed,
      score: draft.score,
      graderName: draft.graderName,
      metrics: draft.metrics,
      totalSteps: draft.totalSteps,
      totalReward: draft.totalReward,
      totalCompleted: draft.totalCompleted,
      totalBacklog: draft.totalBacklog,
      totalSlaBreach: draft.totalSlaBreach,
      fairnessGap: draft.fairnessGap,
      terminated: draft.terminated,
      truncated: draft.truncated,
      timestamp: Date.now(),
      backlogSeries: draft.backlogSeries.map((b) => ({ day: b.day, value: b.backlog })),
      rewardSeries: [],
    };
    const newRuns = [run, ...state.episodeRuns].slice(0, 50);
    localStorage.setItem('gov_episode_runs', JSON.stringify(newRuns));
    return { episodeRuns: newRuns };
  }),

  setError: (msg) => set({ error: msg }),

  setTaskId: (tid) => set({ taskId: tid }),
  setSeed: (s) => set({ seed: s }),
  setStepsInput: (value) => set({ stepsInput: value }),
  setIsSmartRunning: (r) => set({ isSmartRunning: r }),
  requestRun: () => set((state) => ({ runRequestId: state.runRequestId + 1 })),
  requestReset: () => set((state) => ({ resetRequestId: state.resetRequestId + 1 })),

  appendLog: (msg) => set((state) => ({ 
    terminalLogs: [...state.terminalLogs, msg].slice(-1000) 
  })),
  clearLogs: () => set({ terminalLogs: [] }),
}));
