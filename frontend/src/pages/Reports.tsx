import { useState } from 'react';
import { useSimulationStore } from '../store/simulationStore';
import { formatScore, CHART_COLORS } from '../utils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { EpisodeRun } from '../types';

const tooltipStyle = {
  contentStyle: { background: '#1e293b', border: '1px solid rgba(100,116,139,0.3)', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#94a3b8' },
};

export default function Reports() {
  const episodeRuns = useSimulationStore((s) => s.episodeRuns);
  const [selectedRun, setSelectedRun] = useState<EpisodeRun | null>(null);
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);

  const runA = episodeRuns.find((r) => r.id === compareA);
  const runB = episodeRuns.find((r) => r.id === compareB);

  const mergedBacklog = (() => {
    if (!runA || !runB) return [];
    const maxLen = Math.max(runA.backlogSeries.length, runB.backlogSeries.length);
    const data = [];
    for (let i = 0; i < maxLen; i++) {
      data.push({
        day: runA.backlogSeries[i]?.day ?? runB.backlogSeries[i]?.day ?? i,
        runA: runA.backlogSeries[i]?.value ?? null,
        runB: runB.backlogSeries[i]?.value ?? null,
      });
    }
    return data;
  })();

  const MetricBar = ({ label, value }: { label: string, value: number }) => {
    const barCount = Math.floor(Math.max(0, Math.min(1, value)) * 20);
    const bar = "█".repeat(barCount);
    const empty = "░".repeat(20 - barCount);
    return (
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-navy-400">
          <span>{label.replace(/_/g, ' ')}</span>
          <span className="font-mono font-bold text-navy-200">{value.toFixed(3)}</span>
        </div>
        <div className="font-mono text-[10px] overflow-hidden whitespace-nowrap leading-none">
          <span className="text-amber-500">{bar}</span>
          <span className="text-navy-800">{empty}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-100" style={{ fontFamily: 'var(--font-serif)' }}>Reports</h1>
          <p className="text-sm text-navy-400 mt-1">Episode history and run comparison</p>
        </div>
      </div>

      {/* Episode History */}
      <div className="card-glass p-5">
        <h3 className="text-xs font-semibold text-navy-300 uppercase tracking-wider mb-3">Episode History</h3>
        {episodeRuns.length === 0 ? (
          <p className="text-navy-500 text-sm">No completed episodes yet. Run a simulation to completion in the Agent Console.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Task</th>
                <th>Seed</th>
                <th>Score</th>
                <th>SLA Breaches</th>
                <th>Completed</th>
                <th>Reward</th>
                <th>Steps</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {episodeRuns.map((run) => (
                <tr key={run.id} className={selectedRun?.id === run.id ? 'bg-navy-700/30' : ''}>
                  <td className="text-[10px] text-navy-500 uppercase">{new Date(run.timestamp).toLocaleString()}</td>
                  <td className="text-navy-100">{run.taskId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td>
                  <td className="font-mono text-xs">{run.seed}</td>
                  <td className="font-mono font-semibold text-amber-400">{formatScore(run.score)}</td>
                  <td className="font-mono text-rose-400">{run.totalSlaBreach}</td>
                  <td className="font-mono">{run.totalCompleted}</td>
                  <td className={`font-mono ${run.totalReward >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{run.totalReward.toFixed(1)}</td>
                  <td className="font-mono">{run.totalSteps}</td>
                  <td>
                    <button className="btn-secondary text-xs py-1 px-2" onClick={() => setSelectedRun(selectedRun?.id === run.id ? null : run)}>
                      {selectedRun?.id === run.id ? 'Hide' : 'Analysis'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Analysis */}
      {selectedRun && (
        <div className="card-glass p-6 animate-slide-in grid grid-cols-12 gap-8 ring-1 ring-amber-500/20">
          <div className="col-span-4 space-y-6">
            <div>
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-4">Run Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-navy-900/50 rounded-lg border border-navy-700/30">
                  <span className="text-[10px] text-navy-500 uppercase block">Grader</span>
                  <div className="font-mono text-xs text-navy-100 mt-1 truncate">{selectedRun.graderName}</div>
                </div>
                <div className="p-3 bg-navy-900/50 rounded-lg border border-navy-700/30">
                  <span className="text-[10px] text-navy-500 uppercase block">Total Steps</span>
                  <div className="font-mono text-xs text-navy-100 mt-1">{selectedRun.totalSteps}</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-navy-900/80 rounded-lg border-l-4 border-amber-500 shadow-2xl">
               <span className="text-[10px] text-amber-500 uppercase font-bold block mb-1">Final Score</span>
               <div className="text-3xl font-mono font-black text-white">{formatScore(selectedRun.score)}</div>
               <div className="text-[10px] text-navy-500 mt-1 uppercase tracking-tighter">Cumulative Reward: {selectedRun.totalReward.toFixed(2)}</div>
            </div>
          </div>

          <div className="col-span-8">
            <h4 className="text-xs font-bold text-navy-300 uppercase tracking-widest mb-4">Grader Performance Metrics</h4>
            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
              {Object.entries(selectedRun.metrics).map(([k, v]) => (
                <MetricBar key={k} label={k} value={typeof v === 'number' ? v : 0} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Compare Runs */}
      {episodeRuns.length >= 2 && (
        <div className="card-glass p-5">
          <h3 className="text-xs font-semibold text-navy-300 uppercase tracking-wider mb-4">Comparison Engine</h3>
          <div className="flex items-end gap-4 mb-6">
            <div>
              <label className="text-[10px] text-navy-500 uppercase block mb-1">Baseline Run</label>
              <select className="select-field text-xs" style={{ width: 280 }} value={compareA ?? ''} onChange={(e) => setCompareA(e.target.value || null)}>
                <option value="">Select baseline...</option>
                {episodeRuns.map((r) => (
                  <option key={r.id} value={r.id}>{r.taskId} ({new Date(r.timestamp).toLocaleTimeString()}) — {formatScore(r.score)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-navy-500 uppercase block mb-1">Target Run</label>
              <select className="select-field text-xs" style={{ width: 280 }} value={compareB ?? ''} onChange={(e) => setCompareB(e.target.value || null)}>
                <option value="">Select target...</option>
                {episodeRuns.map((r) => (
                  <option key={r.id} value={r.id}>{r.taskId} ({new Date(r.timestamp).toLocaleTimeString()}) — {formatScore(r.score)}</option>
                ))}
              </select>
            </div>
            <button
              className="btn-primary text-xs h-9 px-6"
              disabled={!compareA || !compareB || compareA === compareB}
              onClick={() => setShowCompare(!showCompare)}
            >
              {showCompare ? 'Close Panel' : 'Compute Analytics'}
            </button>
          </div>

          {showCompare && runA && runB && (
            <div className="animate-fade-in space-y-6">
              <div className="h-[300px] w-full">
                <h4 className="text-xs text-navy-400 mb-4 uppercase tracking-widest text-center">Backlog Trajectory Comparison</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mergedBacklog}>
                    <CartesianGrid stroke="rgba(100,116,139,0.1)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} />
                    <Tooltip {...tooltipStyle} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                    <Line type="stepAfter" dataKey="runA" name="Baseline" stroke={CHART_COLORS.amber} strokeWidth={3} dot={false} animationDuration={1000} />
                    <Line type="stepAfter" dataKey="runB" name="Target" stroke={CHART_COLORS.sky} strokeWidth={3} dot={false} animationDuration={1000} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4">
                {[runA, runB].map((run, idx) => (
                  <div key={run.id} className="p-4 rounded-xl bg-navy-900 border border-navy-700/50">
                    <div className="text-[10px] text-navy-500 uppercase tracking-widest mb-3 font-bold">
                      {idx === 0 ? 'Baseline' : 'Comparison Target'}
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 text-xs">
                      <span className="text-navy-400">Final Score</span><span className="font-mono text-right text-amber-400 font-bold">{formatScore(run.score)}</span>
                      <span className="text-navy-400">SLA Breaches</span><span className="font-mono text-right text-rose-400">{run.totalSlaBreach}</span>
                      <span className="text-navy-400">Completion</span><span className="font-mono text-right text-navy-200">{run.totalCompleted} cases</span>
                      <span className="text-navy-400">Fairness Gap</span><span className="font-mono text-right text-navy-200">{run.fairnessGap.toFixed(3)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
