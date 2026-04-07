import { useEffect, useRef } from 'react';
import { useSimulationStore } from '../store/simulationStore';

export default function TerminalConsole() {
  const logs = useSimulationStore((s) => s.terminalLogs);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full card-glass overflow-hidden">
      <div className="px-5 py-4 border-b border-navy-700/30 bg-navy-900/60">
        <h2 className="text-sm font-semibold text-navy-100">Output</h2>
        <p className="text-xs text-navy-400 mt-1">Live step-by-step simulation updates</p>
      </div>

      <div ref={scrollRef} className="flex-1 p-5 overflow-y-auto space-y-3">
        {logs.length === 0 ? (
          <div className="text-sm text-navy-500">No simulation output yet.</div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${getLogClassName(log)}`}
            >
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getLogClassName(log: string): string {
  const lower = log.toLowerCase();
  if (lower.startsWith('error')) {
    return 'border-rose-500/30 bg-rose-500/10 text-rose-300';
  }
  if (lower.includes('reward: -')) {
    return 'border-rose-500/20 bg-navy-900/40 text-navy-100';
  }
  if (lower.includes('reward: +')) {
    return 'border-emerald-500/20 bg-navy-900/40 text-navy-100';
  }
  if (lower.startsWith('notes:')) {
    return 'border-amber-500/20 bg-amber-500/5 text-amber-100';
  }
  return 'border-navy-700/30 bg-navy-900/40 text-navy-100';
}
