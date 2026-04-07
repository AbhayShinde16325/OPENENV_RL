import { useSimulationStore } from '../store/simulationStore';
import { formatServiceId, PRIORITY_LABELS } from '../utils';

export default function RightDrawer() {
  const obs = useSimulationStore((s) => s.observation);

  const StatItem = ({ label, value, sub }: { label: string, value: string, sub?: string }) => (
    <div className="p-3 bg-navy-900/50 rounded-lg border border-navy-700/30">
      <span className="text-[10px] text-navy-500 uppercase block mb-1 font-bold tracking-wider">{label}</span>
      <div className="text-xs font-mono text-navy-100 truncate">{value}</div>
      {sub && <div className="text-[9px] text-navy-500 mt-0.5">{sub}</div>}
    </div>
  );

  return (
    <aside className="flex flex-col gap-4 p-5 border-l border-navy-700/60 bg-navy-900 text-xs overflow-y-auto" style={{ width: 280 }}>
      <div>
        <div className="text-[10px] text-amber-500 uppercase tracking-[0.2em] font-black mb-6">Live Status Snapshot</div>
        
        {!obs ? (
           <div className="flex flex-col items-center justify-center p-8 text-center text-navy-600 space-y-3">
             <div className="text-2xl opacity-20">📡</div>
             <p className="text-[10px] uppercase font-bold tracking-widest">Awaiting Simulation Data</p>
           </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
           <StatItem 
              label="Inference Status" 
              value={obs.last_action_valid ? 'VALID_EXECUTION' : 'INVALID_ACTION'} 
              sub={obs.last_action_message || 'No system message'}
            />
            
            <StatItem 
              label="Policy Configuration" 
              value={PRIORITY_LABELS[obs.priority_mode] || obs.priority_mode} 
              sub="Current orchestration strategy"
            />

            <StatItem 
              label="Critical Resources" 
              value={`${obs.escalation_budget_remaining} Escalations`} 
              sub="Strategic budget remaining"
            />

            <div className="p-3 bg-navy-900/50 rounded-lg border border-navy-700/30">
              <span className="text-[10px] text-navy-500 uppercase block mb-3 font-bold tracking-wider">Deployment Breakdown</span>
              <div className="space-y-2">
                {Object.entries(obs.officer_pool.allocations).map(([service, count]) => (
                  <div key={service} className="flex justify-between items-center text-[10px]">
                    <span className="text-navy-400 font-mono">{formatServiceId(service).slice(0, 16)}</span>
                    <div className="flex items-center gap-2">
                       <div className="w-16 h-1 bg-navy-800 rounded-full overflow-hidden">
                         <div className="bg-amber-500 h-full" style={{ width: `${(count / 20) * 100}%` }} />
                       </div>
                       <span className="font-mono text-amber-400 w-4 text-right">{count}</span>
                    </div>
                  </div>
                ))}
                <div className="mt-2 pt-2 border-t border-navy-700 flex justify-between items-center text-[10px]">
                  <span className="text-sky-400 font-bold uppercase italic">Reserve Pool</span>
                  <span className="font-mono text-sky-400">{obs.officer_pool.reserve_officers}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-navy-950/80 rounded-lg ring-1 ring-emerald-500/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-emerald-500 uppercase font-bold tracking-widest">Episode Timeline</span>
                <span className="text-[10px] text-navy-400 font-mono">{obs.day} / {obs.max_days}</span>
              </div>
              <div className="w-full h-1 bg-navy-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" 
                  style={{ width: `${(obs.day / obs.max_days) * 100}%` }} 
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
