import { useHealth } from '../api/hooks';
import { useSimulationStore } from '../store/simulationStore';
import type { TaskId } from '../types';

const TASK_OPTIONS: { value: TaskId; label: string }[] = [
  { value: 'district_backlog_easy', label: 'Easy' },
  { value: 'mixed_urgency_medium', label: 'Medium' },
  { value: 'cross_department_hard', label: 'Hard' },
];

export default function TopBar() {
  const health = useHealth();
  const {
    sessionId,
    taskId,
    stepsInput,
    isSmartRunning,
    error,
    setTaskId,
    setStepsInput,
    requestRun,
    requestReset,
    setError,
  } = useSimulationStore();

  const isOnline = health.isSuccess && health.data?.status === 'ok';

  return (
    <header className="h-20 bg-navy-900 border-b border-navy-700/50 flex items-center justify-between px-6 z-50 gap-6">
      <div className="flex items-center gap-4 min-w-[240px]">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
          <span className="text-navy-950 font-black text-xl">O</span>
        </div>
        <div>
          <h1 className="font-bold text-navy-100 tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>OPENENV_RL</h1>
          <div className="flex items-center gap-2">
            <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
            <span className="text-[10px] text-navy-500 font-bold uppercase tracking-widest">
              {isOnline ? 'Backend Connected' : 'Connecting to Backend...'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-end justify-center gap-3">
        <div className="min-w-[150px]">
          <label className="text-[10px] text-navy-500 uppercase font-bold mb-1 block">Task Difficulty</label>
          <select className="select-field text-sm" value={taskId} onChange={(e) => setTaskId(e.target.value as TaskId)} disabled={isSmartRunning}>
            {TASK_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="w-[120px]">
          <label className="text-[10px] text-navy-500 uppercase font-bold mb-1 block">Steps</label>
          <input
            type="text"
            inputMode="numeric"
            className="input-field text-sm font-mono"
            value={stepsInput}
            onChange={(e) => setStepsInput(e.target.value)}
            disabled={isSmartRunning}
          />
        </div>

        <div className="min-w-[180px]">
          <label className="text-[10px] text-navy-500 uppercase font-bold mb-1 block">Agent</label>
          <div className="input-field text-sm">Smart Agent</div>
        </div>

        <div className="flex items-end gap-2">
          <button className="btn-primary h-10 px-6" onClick={requestRun} disabled={!isOnline || isSmartRunning}>
            Start
          </button>
          <button className="btn-secondary h-10 px-6" onClick={requestReset}>
            Reset
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6 min-w-[280px] justify-end">
        {error && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded text-rose-400 text-[10px]">
            <span className="font-bold">ERROR</span>
            <span className="opacity-80 max-w-[190px] truncate">{error}</span>
            <button onClick={() => setError(null)} className="ml-1 hover:text-white transition-colors">x</button>
          </div>
        )}

        <div className="flex flex-col items-end">
          <span className="text-[10px] text-navy-500 uppercase font-black">Session</span>
          <span className="text-xs font-mono text-navy-300">{sessionId ? sessionId.slice(0, 12).toUpperCase() : 'Idle - Ready'}</span>
        </div>
      </div>
    </header>
  );
}
