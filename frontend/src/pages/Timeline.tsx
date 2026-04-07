import { useSimulationStore } from '../store/simulationStore';
import { CHART_COLORS } from '../utils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, BarChart, Bar,
} from 'recharts';

const tooltipStyle = {
  contentStyle: { background: '#1e293b', border: '1px solid rgba(100,116,139,0.3)', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#94a3b8' },
};

export default function Timeline() {
  const obs = useSimulationStore((s) => s.observation);
  const backlogSeries = useSimulationStore((s) => s.backlogSeries);
  const arrivalCompletionSeries = useSimulationStore((s) => s.arrivalCompletionSeries);
  const slaSeries = useSimulationStore((s) => s.slaSeries);
  const rewardSeries = useSimulationStore((s) => s.rewardSeries);
  const fairnessSeries = useSimulationStore((s) => s.fairnessSeries);

  if (!obs) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-navy-400">Start a session to view timeline data.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-navy-100" style={{ fontFamily: 'var(--font-serif)' }}>Timeline</h1>
        <p className="text-sm text-navy-400 mt-1">Charts tracking simulation progression over time</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Backlog Over Time */}
        <div className="card-glass p-4">
          <h3 className="text-xs font-semibold text-navy-300 uppercase tracking-wider mb-3">Backlog Over Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={backlogSeries}>
              <CartesianGrid stroke="rgba(100,116,139,0.15)" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="backlog" stroke={CHART_COLORS.amber} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Arrivals vs Completions */}
        <div className="card-glass p-4">
          <h3 className="text-xs font-semibold text-navy-300 uppercase tracking-wider mb-3">Arrivals vs Completions</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={arrivalCompletionSeries}>
              <CartesianGrid stroke="rgba(100,116,139,0.15)" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Area type="monotone" dataKey="arrivals" stroke={CHART_COLORS.sky} fill={CHART_COLORS.sky} fillOpacity={0.15} strokeWidth={2} />
              <Area type="monotone" dataKey="completions" stroke={CHART_COLORS.emerald} fill={CHART_COLORS.emerald} fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* SLA Breaches (cumulative) */}
        <div className="card-glass p-4">
          <h3 className="text-xs font-semibold text-navy-300 uppercase tracking-wider mb-3">SLA Breaches (Cumulative)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={slaSeries}>
              <CartesianGrid stroke="rgba(100,116,139,0.15)" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="breaches" fill={CHART_COLORS.rose} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Reward Components */}
        <div className="card-glass p-4">
          <h3 className="text-xs font-semibold text-navy-300 uppercase tracking-wider mb-3">Reward Breakdown per Step</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rewardSeries}>
              <CartesianGrid stroke="rgba(100,116,139,0.15)" strokeDasharray="3 3" />
              <XAxis dataKey="step" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
              <Bar dataKey="progress" stackId="a" fill={CHART_COLORS.emerald} />
              <Bar dataKey="completion" stackId="a" fill={CHART_COLORS.teal} />
              <Bar dataKey="waiting" stackId="a" fill={CHART_COLORS.orange} />
              <Bar dataKey="sla" stackId="a" fill={CHART_COLORS.rose} />
              <Bar dataKey="fairness" stackId="a" fill={CHART_COLORS.violet} />
              <Bar dataKey="idle" stackId="a" fill={CHART_COLORS.navy} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fairness Gap Trend */}
      <div className="card-glass p-4">
        <h3 className="text-xs font-semibold text-navy-300 uppercase tracking-wider mb-3">Fairness Gap Trend</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={fairnessSeries}>
            <CartesianGrid stroke="rgba(100,116,139,0.15)" strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 'auto']} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey="gap" stroke={CHART_COLORS.violet} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Queue Snapshot Table */}
      <div className="card-glass p-5">
        <h3 className="text-xs font-semibold text-navy-300 uppercase tracking-wider mb-3">Current Queue Snapshots</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Submission</th>
              <th>Doc Verify</th>
              <th>Field Verify</th>
              <th>Approval</th>
              <th>Issuance</th>
              <th>Active</th>
              <th>Avg Age</th>
            </tr>
          </thead>
          <tbody>
            {obs.queue_snapshots.map((q) => (
              <tr key={q.service}>
                <td className="font-medium text-navy-100">{q.service.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td>
                <td className="font-mono">{q.stage_counts['submission'] ?? 0}</td>
                <td className="font-mono">{q.stage_counts['document_verification'] ?? 0}</td>
                <td className="font-mono">{q.stage_counts['field_verification'] ?? 0}</td>
                <td className="font-mono">{q.stage_counts['approval'] ?? 0}</td>
                <td className="font-mono">{q.stage_counts['issuance'] ?? 0}</td>
                <td className="font-mono font-semibold text-amber-400">{q.active_cases}</td>
                <td className="font-mono">{q.avg_age_days.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
