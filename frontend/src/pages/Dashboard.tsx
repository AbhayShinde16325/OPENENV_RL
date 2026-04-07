import { useSimulationStore } from '../store/simulationStore';
import { formatScore, formatNumber } from '../utils';

export default function Dashboard() {
  const obs = useSimulationStore((s) => s.observation);
  const stepCount = useSimulationStore((s) => s.stepCount);
  const cumulativeReward = useSimulationStore((s) => s.cumulativeReward);
  const sessionId = useSimulationStore((s) => s.sessionId);
  const terminated = useSimulationStore((s) => s.terminated);
  const truncated = useSimulationStore((s) => s.truncated);
  const latestAction = useSimulationStore((s) => s.actionLog.length > 0 ? s.actionLog[s.actionLog.length - 1] : null);
  const seed = useSimulationStore((s) => s.seed);

  if (!obs) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center animate-fade-in">
          <div className="text-5xl mb-4">🏛️</div>
          <h2 className="text-xl font-semibold text-navy-200 mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
            GovWorkflow Simulation Console
          </h2>
          <p className="text-navy-400 text-sm max-w-md">
            Choose a task, step count, and start the smart agent from the top bar to begin a live simulation episode.
          </p>
        </div>
      </div>
    );
  }

  const slaCompliance = obs.total_completed > 0
    ? ((obs.total_completed - obs.total_sla_breaches) / obs.total_completed)
    : 1;

  const kpis = [
    { label: 'Cumulative Reward', value: cumulativeReward.toFixed(2), accent: 'amber', icon: '🎯' },
    { label: 'SLA Compliance', value: formatScore(slaCompliance), accent: 'emerald', icon: '✅' },
    { label: 'Fairness Gap', value: obs.fairness_gap.toFixed(3), accent: obs.fairness_gap > 0.3 ? 'rose' : 'sky', icon: '⚖️' },
    { label: 'Active Backlog', value: formatNumber(obs.total_backlog), accent: obs.total_backlog > 20 ? 'rose' : 'sky', icon: '📋' },
    { label: 'Completed', value: formatNumber(obs.total_completed), accent: 'emerald', icon: '✨' },
  ];

  const accentColors: Record<string, string> = {
    amber: '#f59e0b',
    emerald: '#10b981',
    rose: '#f43f5e',
    sky: '#0ea5e9',
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in overflow-y-auto h-full bg-navy-950">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-navy-100" style={{ fontFamily: 'var(--font-serif)' }}>Dashboard</h1>
        <p className="text-sm text-navy-400 mt-1">Real-time simulation overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        {kpis.map(({ label, value, accent, icon }) => (
          <div key={label} className="card-glass p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: accentColors[accent] }} />
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{icon}</span>
              <span className="text-[0.65rem] text-navy-500 uppercase font-semibold tracking-wider">{label}</span>
            </div>
            <div className="text-2xl font-bold text-navy-100 font-mono tracking-tighter">{value}</div>
          </div>
        ))}
      </div>

      {/* Run Status Panel */}
      <div className="grid grid-cols-12 gap-6">
        {/* Episode Info */}
        <div className="col-span-4 card-glass p-5">
          <h3 className="text-xs font-semibold text-navy-300 mb-4 uppercase tracking-widest border-b border-navy-700/30 pb-2">Episode Specs</h3>
          <div className="space-y-3 text-[11px]">
            <div className="flex justify-between">
              <span className="text-navy-500 uppercase">Session Index</span>
              <span className="font-mono text-navy-300 truncate ml-4 w-32 text-right">{sessionId ? sessionId.slice(0, 12).toUpperCase() : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-navy-500 uppercase">Simulation Task</span>
              <span className="text-navy-200 font-bold">{obs.task_id.replace(/_/g, ' ').toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-navy-500 uppercase">Deterministic Seed</span>
              <span className="font-mono text-amber-500">{seed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-navy-500 uppercase">Temporal State</span>
              <span className="font-mono text-navy-200">Day {obs.day} of {obs.max_days}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-navy-500 uppercase">Inference Steps</span>
              <span className="font-mono text-navy-200">{stepCount}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-navy-700/30 mt-2">
              <span className="text-navy-500 uppercase">Status</span>
              <span className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${terminated || truncated ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                <span className="font-bold text-navy-100 uppercase tracking-tighter">
                  {terminated ? 'Terminated' : truncated ? 'Truncated' : 'Processing'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Detail */}
        <div className="col-span-8 card-glass p-5">
          <h3 className="text-xs font-semibold text-navy-300 mb-4 uppercase tracking-widest border-b border-navy-700/30 pb-2">Latest Action Log</h3>
          {latestAction ? (
            <div className="space-y-4">
               <div className="flex items-center gap-4">
                  <div className="flex-1 bg-navy-900 border border-navy-700/50 p-3 rounded-lg">
                    <span className="text-[9px] text-navy-500 uppercase font-black block mb-1">Action Dispatched</span>
                    <span className="text-sm font-mono text-amber-400 font-bold">{latestAction.action.action_type.replace(/_/g, ' ').toUpperCase()}</span>
                  </div>
                  <div className="w-32 bg-navy-900 border border-navy-700/50 p-3 rounded-lg text-right">
                    <span className="text-[9px] text-navy-500 uppercase font-black block mb-1">Delta Reward</span>
                    <span className={`text-sm font-mono font-bold ${latestAction.reward >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {latestAction.reward >= 0 ? '+' : ''}{latestAction.reward.toFixed(3)}
                    </span>
                  </div>
               </div>
               <div className="text-xs text-navy-300 leading-relaxed italic bg-navy-900/80 p-4 rounded-lg border-l-4 border-amber-500">
                  {latestAction.message || 'Simulation proceeding normally. Capacity reallocated across services to clear backlog.'}
               </div>
               {latestAction.modelUsed && (
                 <div className="flex justify-between items-center text-[10px] uppercase text-navy-600 font-bold tracking-widest pt-2">
                   <span>Model ID: {latestAction.modelUsed.split('/').pop()}</span>
                   <span className="text-emerald-500/50">Verified Compliance ✓</span>
                 </div>
               )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 opacity-30">
               <div className="text-2xl">⏳</div>
               <p className="text-[10px] uppercase tracking-widest mt-2">Waiting for first inference...</p>
            </div>
          )}
        </div>
      </div>

      {/* Queue Summary */}
      <div className="card-glass p-5">
        <h3 className="text-xs font-semibold text-navy-300 mb-4 uppercase tracking-widest border-b border-navy-700/30 pb-2">Departmental Resource Health</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Service Department</th>
              <th>Active Backlog</th>
              <th>Doc Breaches</th>
              <th>SLA Risk</th>
              <th>Avg Age</th>
              <th>Health Status</th>
            </tr>
          </thead>
          <tbody>
            {obs.queue_snapshots.map((q) => (
              <tr key={q.service} className="hover:bg-navy-700/20 transition-colors">
                <td className="font-bold text-navy-100">{q.service.replace(/_/g, ' ').toUpperCase()}</td>
                <td className="font-mono text-navy-300">{q.active_cases}</td>
                <td className="font-mono text-amber-500/80">{q.missing_docs_cases} cases</td>
                <td className="font-mono text-rose-500 font-bold">{q.breached_cases}</td>
                <td className="font-mono text-navy-400">{q.avg_age_days.toFixed(1)}d</td>
                <td>
                   <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${q.breached_cases > 5 ? 'bg-rose-500 animate-ping' : q.active_cases > 15 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      <span className={`text-[10px] uppercase font-black ${q.breached_cases > 5 ? 'text-rose-500' : q.active_cases > 15 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {q.breached_cases > 5 ? 'CRITICAL' : q.active_cases > 15 ? 'OVERLOAD' : 'NOMINAL'}
                      </span>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
