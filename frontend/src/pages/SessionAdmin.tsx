import { useHealth, useSessions, useDeleteSession } from '../api/hooks';

export default function SessionAdmin() {
  const health = useHealth();
  const sessions = useSessions();
  const deleteMutation = useDeleteSession();

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-navy-100" style={{ fontFamily: 'var(--font-serif)' }}>Session Admin</h1>
        <p className="text-sm text-navy-400 mt-1">Manage active sessions and view backend health</p>
      </div>

      {/* Health Panel */}
      <div className="card-glass p-5">
        <h3 className="text-xs font-semibold text-navy-300 uppercase tracking-wider mb-4">Backend Health</h3>
        {health.isLoading ? (
          <p className="text-navy-500 text-sm">Loading...</p>
        ) : health.isError ? (
          <div className="toast-error">Unable to reach backend. Is the server running?</div>
        ) : health.data ? (
          <div className="grid grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-navy-800/50 border border-navy-600/20">
              <div className="text-[0.65rem] text-navy-500 uppercase mb-1">Status</div>
              <div className="flex items-center gap-2">
                <span className={`status-dot ${health.data.status === 'ok' ? 'online' : 'offline'}`} />
                <span className="font-semibold text-navy-100 capitalize">{health.data.status}</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-navy-800/50 border border-navy-600/20">
              <div className="text-[0.65rem] text-navy-500 uppercase mb-1">Version</div>
              <div className="font-mono text-navy-100">{health.data.version}</div>
            </div>
            <div className="p-3 rounded-lg bg-navy-800/50 border border-navy-600/20">
              <div className="text-[0.65rem] text-navy-500 uppercase mb-1">Active Sessions</div>
              <div className="font-mono text-amber-400 text-xl font-bold">{health.data.active_sessions}</div>
            </div>
            <div className="p-3 rounded-lg bg-navy-800/50 border border-navy-600/20">
              <div className="text-[0.65rem] text-navy-500 uppercase mb-1">Available Tasks</div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {health.data.available_tasks.map((t) => (
                  <span key={t} className="badge badge-amber text-[0.6rem]">{t.replace(/_/g, ' ')}</span>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Active Sessions */}
      <div className="card-glass p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-navy-300 uppercase tracking-wider">Active Sessions</h3>
          <button
            className="btn-secondary text-xs py-1 px-3"
            onClick={() => sessions.refetch()}
            disabled={sessions.isFetching}
          >
            🔄 Refresh
          </button>
        </div>

        {sessions.isLoading ? (
          <p className="text-navy-500 text-sm">Loading sessions...</p>
        ) : sessions.isError ? (
          <div className="toast-error">Failed to load sessions.</div>
        ) : sessions.data?.session_ids.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-navy-400 text-sm">No active sessions</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Session ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.data?.session_ids.map((id, i) => (
                <tr key={id}>
                  <td className="font-mono text-xs text-navy-400">{i + 1}</td>
                  <td className="font-mono text-xs text-navy-200">{id}</td>
                  <td>
                    <button
                      className="btn-danger text-xs"
                      onClick={() => deleteMutation.mutate(id)}
                      disabled={deleteMutation.isPending}
                    >
                      🗑 Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {sessions.data && (
          <div className="mt-3 text-xs text-navy-500">
            Total: {sessions.data.active_sessions} session{sessions.data.active_sessions !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
