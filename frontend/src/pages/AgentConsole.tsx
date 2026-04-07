import { useEffect, useRef } from 'react';
import { useGrade, useReset, useStep } from '../api/hooks';
import TerminalConsole from '../components/TerminalConsole';
import { useSimulationStore } from '../store/simulationStore';
import { ActionType } from '../types';
import { formatReward } from '../utils';

const TASK_LABELS = {
  district_backlog_easy: 'Easy',
  mixed_urgency_medium: 'Medium',
  cross_department_hard: 'Hard',
};

function getSeedLabel(seed: string, taskId: string): string {
  if (seed !== 'auto') return seed;
  if (taskId === 'district_backlog_easy') return '11';
  if (taskId === 'mixed_urgency_medium') return '22';
  return '33';
}

function getStepLimit(stepsInput: string): number {
  const parsed = parseInt(stepsInput, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return 10;
  return parsed;
}

export default function AgentConsole() {
  const {
    sessionId,
    observation,
    cumulativeReward,
    taskId,
    seed,
    stepsInput,
    isSmartRunning,
    runRequestId,
    resetRequestId,
    appendLog,
    clearLogs,
    resetSession,
    setSession,
    updateState,
    saveEpisodeRunDraft,
    setError,
    setIsSmartRunning,
  } = useSimulationStore();

  const resetMutation = useReset();
  const stepMutation = useStep();
  const gradeMutation = useGrade();

  const isRunningRef = useRef(false);
  const lastRunRequestRef = useRef(0);
  const lastResetRequestRef = useRef(0);

  useEffect(() => {
    isRunningRef.current = isSmartRunning;
  }, [isSmartRunning]);

  useEffect(() => {
    if (runRequestId === 0 || runRequestId === lastRunRequestRef.current) return;
    lastRunRequestRef.current = runRequestId;
    void startSimulation();
  }, [runRequestId]);

  useEffect(() => {
    if (resetRequestId === 0 || resetRequestId === lastResetRequestRef.current) return;
    lastResetRequestRef.current = resetRequestId;
    setIsSmartRunning(false);
    resetSession();
    clearLogs();
    appendLog('Ready to start a simulation.');
  }, [resetRequestId]);

  const startSimulation = async () => {
    if (isRunningRef.current) return;

    const stepLimit = getStepLimit(stepsInput);

    clearLogs();
    resetSession();
    setError(null);
    setIsSmartRunning(true);
    appendLog(`Starting ${TASK_LABELS[taskId]} simulation with ${stepLimit} step${stepLimit === 1 ? '' : 's'}.`);

    try {
      const resetData = await resetMutation.mutateAsync({
        task_id: taskId,
        seed: seed === 'auto' ? undefined : parseInt(seed, 10),
      });

      setSession(resetData.session_id, resetData.observation);
      appendLog(`Session created. Seed: ${getSeedLabel(seed, taskId)}.`);

      let currentObservation = resetData.observation;
      let totalReward = 0;
      let stepNumber = 0;
      let terminated = false;
      let truncated = false;
      let backlogSeries: { day: number; backlog: number }[] = [];

      while (isRunningRef.current && !terminated && !truncated && stepNumber < stepLimit) {
        const stepData = await stepMutation.mutateAsync({
          session_id: resetData.session_id,
          action: { action_type: ActionType.ADVANCE_TIME },
        });

        updateState(
          stepData.observation,
          stepData.reward,
          stepData.terminated,
          stepData.truncated,
          stepData.info,
          { action_type: ActionType.ADVANCE_TIME },
        );

        stepNumber += 1;
        totalReward += stepData.reward;
        currentObservation = stepData.observation;
        terminated = stepData.terminated;
        truncated = stepData.truncated;

        if (!backlogSeries.some((entry) => entry.day === currentObservation.day)) {
          backlogSeries = [...backlogSeries, { day: currentObservation.day, backlog: currentObservation.total_backlog }];
        }

        appendLog(
          `Step ${stepNumber}: Advance time | Reward: ${formatReward(stepData.reward)} | Backlog: ${currentObservation.total_backlog}`
        );

        if (stepData.info.notes.length > 0) {
          appendLog(`Notes: ${stepData.info.notes.join(' | ')}`);
        }
      }

      const gradeData = await gradeMutation.mutateAsync({ session_id: resetData.session_id });
      appendLog(`Run finished. Score: ${gradeData.score.toFixed(3)} | Completed: ${currentObservation.total_completed} | SLA breaches: ${currentObservation.total_sla_breaches}`);

      saveEpisodeRunDraft({
        taskId,
        seed: parseInt(getSeedLabel(seed, taskId), 10),
        score: gradeData.score,
        graderName: gradeData.grader_name,
        metrics: gradeData.metrics,
        totalSteps: stepNumber,
        totalReward,
        totalCompleted: currentObservation.total_completed,
        totalBacklog: currentObservation.total_backlog,
        totalSlaBreach: currentObservation.total_sla_breaches,
        fairnessGap: currentObservation.fairness_gap,
        terminated,
        truncated,
        backlogSeries,
      });
    } catch (error: any) {
      const message = error?.message || 'Simulation failed.';
      appendLog(`Error: ${message}`);
      setError(message);
    } finally {
      setIsSmartRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-navy-950 p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-100" style={{ fontFamily: 'var(--font-serif)' }}>Simulation Runner</h1>
        <p className="text-sm text-navy-400 mt-1">Start a run from the top bar and follow the output below.</p>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden">
        <div className="col-span-8 flex flex-col overflow-hidden">
          <TerminalConsole />
        </div>

        <div className="col-span-4 space-y-4 overflow-y-auto">
          <div className="card-glass p-5">
            <h3 className="text-xs font-semibold text-navy-300 uppercase tracking-widest border-b border-navy-700/30 pb-2 mb-4">Current Run</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-navy-500 uppercase text-[10px] font-bold">Difficulty</span>
                <span className="text-navy-100 font-semibold">{TASK_LABELS[taskId]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500 uppercase text-[10px] font-bold">Steps</span>
                <span className="font-mono text-navy-100">{getStepLimit(stepsInput)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500 uppercase text-[10px] font-bold">Session</span>
                <span className="font-mono text-navy-100">{sessionId ? sessionId.slice(0, 12) : 'idle'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500 uppercase text-[10px] font-bold">Status</span>
                <span className={isSmartRunning ? 'text-emerald-400 font-semibold' : 'text-navy-300'}>{isSmartRunning ? 'Running' : 'Idle'}</span>
              </div>
            </div>
          </div>

          <div className="card-glass p-5">
            <h3 className="text-xs font-semibold text-navy-300 uppercase tracking-widest border-b border-navy-700/30 pb-2 mb-4">Live KPIs</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-navy-900/50 rounded-lg border border-navy-700/30">
                <div className="text-[10px] text-navy-500 uppercase font-bold">Reward</div>
                <div className={`text-2xl font-mono mt-2 ${cumulativeReward >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{cumulativeReward.toFixed(2)}</div>
              </div>
              <div className="p-4 bg-navy-900/50 rounded-lg border border-navy-700/30">
                <div className="text-[10px] text-navy-500 uppercase font-bold">Backlog</div>
                <div className="text-2xl font-mono mt-2 text-amber-400">{observation?.total_backlog || 0}</div>
              </div>
            </div>
          </div>

          <div className="card-glass p-5">
            <p className="text-xs text-navy-400 leading-relaxed">
              This frontend now uses only the FastAPI backend. No external LLM APIs or frontend API keys are used.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
