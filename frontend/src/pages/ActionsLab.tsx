import { useState } from 'react';
import { useStep } from '../api/hooks';
import { useSimulationStore } from '../store/simulationStore';
import { ActionType, PriorityMode, ServiceType } from '../types';
import { SERVICE_LABELS, PRIORITY_LABELS, formatReward, ACTION_LABELS } from '../utils';

export default function ActionsLab() {
  const obs = useSimulationStore((s) => s.observation);
  const sessionId = useSimulationStore((s) => s.sessionId);
  const actionLog = useSimulationStore((s) => s.actionLog);
  const terminated = useSimulationStore((s) => s.terminated);
  const truncated = useSimulationStore((s) => s.truncated);
  const stepMutation = useStep();

  const [priorityMode, setPriorityMode] = useState<PriorityMode>(PriorityMode.BALANCED);
  const [selectedService, setSelectedService] = useState<ServiceType>(ServiceType.PASSPORT);
  const [targetService, setTargetService] = useState<ServiceType>(ServiceType.DRIVING_LICENSE);
  const [officerDelta, setOfficerDelta] = useState(1);

  const episodeActive = !!sessionId && !terminated && !truncated;
  const activeServices = obs?.queue_snapshots.map((q) => q.service) ?? [];

  const sendAction = (action: Parameters<typeof stepMutation.mutate>[0]['action']) => {
    if (!sessionId) return;
    stepMutation.mutate({ session_id: sessionId, action });
  };

  if (!obs) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-navy-400">Start a session to use Actions Lab.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-navy-100" style={{ fontFamily: 'var(--font-serif)' }}>Actions Lab</h1>
        <p className="text-sm text-navy-400 mt-1">Manually control the simulation with individual actions</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Priority Mode */}
        <div className="card-glass p-4">
          <h3 className="text-xs font-semibold text-navy-300 uppercase tracking-wider mb-3">Set Priority Mode</h3>
          <select
            className="select-field mb-3"
            value={priorityMode}
            onChange={(e) => setPriorityMode(e.target.value as PriorityMode)}
          >
            {Object.values(PriorityMode).map((m) => (
              <option key={m} value={m}>{PRIORITY_LABELS[m]}</option>
            ))}
          </select>
          <button
            className="btn-primary w-full text-sm"
            disabled={!episodeActive || stepMutation.isPending}
            onClick={() => sendAction({ action_type: ActionType.SET_PRIORITY_MODE, priority_mode: priorityMode })}
          >
            Apply Priority
          </button>
        </div>

        {/* Assign Capacity */}
        <div className="card-glass p-4">
          <h3 className="text-xs font-semibold text-navy-300 uppercase tracking-wider mb-3">Assign Capacity</h3>
          <select
            className="select-field mb-2"
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value as ServiceType)}
          >
            {activeServices.map((s) => (
              <option key={s} value={s}>{SERVICE_LABELS[s] ?? s}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 mb-3">
            <label className="text-xs text-navy-400">Officers:</label>
            <input
              type="range"
              min={1}
              max={Math.max(obs.officer_pool.reserve_officers, 1)}
              value={officerDelta}
              onChange={(e) => setOfficerDelta(parseInt(e.target.value))}
            />
            <span className="font-mono text-amber-400 text-sm w-6 text-right">{officerDelta}</span>
          </div>
          <div className="text-[0.65rem] text-navy-500 mb-2">Reserve: {obs.officer_pool.reserve_officers}</div>
          <button
            className="btn-primary w-full text-sm"
            disabled={!episodeActive || stepMutation.isPending || obs.officer_pool.reserve_officers < 1}
            onClick={() => sendAction({ action_type: ActionType.ASSIGN_CAPACITY, service: selectedService, officer_delta: officerDelta })}
          >
            Assign Officers
          </button>
        </div>

        {/* Reallocate Officers */}
        <div className="card-glass p-4">
          <h3 className="text-xs font-semibold text-navy-300 uppercase tracking-wider mb-3">Reallocate Officers</h3>
          <div className="flex gap-2 mb-2">
            <div className="flex-1">
              <label className="text-[0.65rem] text-navy-500 mb-1 block">From</label>
              <select className="select-field text-xs" value={selectedService} onChange={(e) => setSelectedService(e.target.value as ServiceType)}>
                {activeServices.map((s) => <option key={s} value={s}>{SERVICE_LABELS[s] ?? s}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[0.65rem] text-navy-500 mb-1 block">To</label>
              <select className="select-field text-xs" value={targetService} onChange={(e) => setTargetService(e.target.value as ServiceType)}>
                {activeServices.map((s) => <option key={s} value={s}>{SERVICE_LABELS[s] ?? s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <label className="text-xs text-navy-400">Count:</label>
            <input type="number" className="input-field text-xs" style={{ width: 60 }} min={1} value={officerDelta} onChange={(e) => setOfficerDelta(parseInt(e.target.value) || 1)} />
          </div>
          <button
            className="btn-primary w-full text-sm"
            disabled={!episodeActive || stepMutation.isPending || selectedService === targetService}
            onClick={() => sendAction({
              action_type: ActionType.REALLOCATE_OFFICERS,
              service: selectedService,
              target_service: targetService,
              officer_delta: officerDelta,
            })}
          >
            Reallocate
          </button>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Resolve Missing Docs */}
        <div className="card-glass p-4">
          <h3 className="text-xs font-semibold text-navy-300 uppercase tracking-wider mb-3">Resolve Missing Documents</h3>
          <select
            className="select-field mb-3"
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value as ServiceType)}
          >
            {activeServices.map((s) => (
              <option key={s} value={s}>
                {SERVICE_LABELS[s] ?? s}
                {obs.queue_snapshots.find(q => q.service === s)?.missing_docs_cases
                  ? ` (${obs.queue_snapshots.find(q => q.service === s)?.missing_docs_cases} pending)`
                  : ''}
              </option>
            ))}
          </select>
          <button
            className="btn-primary w-full text-sm"
            disabled={!episodeActive || stepMutation.isPending}
            onClick={() => sendAction({ action_type: ActionType.REQUEST_MISSING_DOCUMENTS, service: selectedService })}
          >
            📄 Resolve Docs
          </button>
        </div>

        {/* Escalate Service */}
        <div className="card-glass p-4">
          <h3 className="text-xs font-semibold text-navy-300 uppercase tracking-wider mb-3">Escalate Service</h3>
          <select
            className="select-field mb-3"
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value as ServiceType)}
          >
            {activeServices.map((s) => <option key={s} value={s}>{SERVICE_LABELS[s] ?? s}</option>)}
          </select>
          <div className="text-[0.65rem] text-navy-500 mb-2">Budget remaining: {obs.escalation_budget_remaining}</div>
          <button
            className="btn-primary w-full text-sm"
            disabled={!episodeActive || stepMutation.isPending || obs.escalation_budget_remaining <= 0}
            onClick={() => sendAction({ action_type: ActionType.ESCALATE_SERVICE, service: selectedService })}
          >
            ⚡ Escalate
          </button>
        </div>

        {/* Advance Time */}
        <div className="card-glass p-4">
          <h3 className="text-xs font-semibold text-navy-300 uppercase tracking-wider mb-3">Advance Time</h3>
          <p className="text-sm text-navy-400 mb-3">Move the simulation forward by one day. This processes all queues and spawns new arrivals.</p>
          <button
            className="btn-primary w-full text-sm"
            disabled={!episodeActive || stepMutation.isPending}
            onClick={() => sendAction({ action_type: ActionType.ADVANCE_TIME })}
          >
            ⏩ Advance Day
          </button>
        </div>
      </div>

      {/* Action Log */}
      <div className="card-glass p-5">
        <h3 className="text-xs font-semibold text-navy-300 uppercase tracking-wider mb-3">Action Log (Last 20)</h3>
        {actionLog.length === 0 ? (
          <p className="text-navy-500 text-sm">No actions taken yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Step</th>
                <th>Day</th>
                <th>Action</th>
                <th>Status</th>
                <th>Reward</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {actionLog.slice(-20).reverse().map((entry, i) => (
                <tr key={i}>
                  <td className="font-mono text-xs">{entry.step}</td>
                  <td className="font-mono text-xs">{entry.day}</td>
                  <td className="text-xs">{ACTION_LABELS[entry.action?.action_type] ?? entry.action?.action_type ?? '—'}</td>
                  <td><span className={`badge ${entry.invalid ? 'badge-invalid' : 'badge-valid'}`}>{entry.invalid ? 'Invalid' : 'Valid'}</span></td>
                  <td className={`font-mono text-xs ${entry.reward >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatReward(entry.reward)}</td>
                  <td className="text-xs text-navy-400 truncate" style={{ maxWidth: 200 }}>{entry.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
