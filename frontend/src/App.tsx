import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TopBar from './components/TopBar';
import LeftNav from './components/LeftNav';
import RightDrawer from './components/RightDrawer';
import Dashboard from './pages/Dashboard';
import AgentConsole from './pages/AgentConsole';
import Reports from './pages/Reports';
import SessionAdmin from './pages/SessionAdmin';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5_000, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex flex-col h-screen">
          <TopBar />
          <div className="flex flex-1 overflow-hidden">
            <LeftNav />
            <main className="flex-1 overflow-hidden">
              <Routes>
                <Route path="/" element={<AgentConsole />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/console" element={<AgentConsole />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/sessions" element={<SessionAdmin />} />
              </Routes>
            </main>
            <RightDrawer />
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
