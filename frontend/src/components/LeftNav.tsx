import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', icon: 'R', label: 'Runner' },
  { to: '/dashboard', icon: 'D', label: 'Dashboard' },
  { to: '/reports', icon: 'R', label: 'Reports' },
  { to: '/sessions', icon: 'S', label: 'Sessions' },
];

export default function LeftNav() {
  return (
    <nav className="flex flex-col gap-1 p-3 border-r border-navy-700/60 bg-navy-800/50" style={{ width: 200, minHeight: '100%' }}>
      <div className="text-[0.65rem] text-navy-500 uppercase tracking-wider font-semibold mb-2 px-3 pt-1">
        Navigation
      </div>
      {NAV_ITEMS.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          end={to === '/'}
        >
          <span className="text-base font-bold">{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}

      <div className="flex-1" />

      <div className="px-3 py-2 mt-4 text-[0.6rem] text-navy-500 leading-relaxed">
        <div className="font-mono">GovWorkflow</div>
        <div>Simulation Console</div>
      </div>
    </nav>
  );
}
