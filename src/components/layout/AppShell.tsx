import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';
import { DemoDisclaimer } from './DemoDisclaimer';
import { useResetKey } from '@/hooks/useResetKey';
import { usePageTracking } from '@/hooks/usePageTracking';
import { useScrollToTop } from '@/hooks/useScrollToTop';

export function AppShell() {
  const resetKey = useResetKey();
  usePageTracking(); // Track route changes for the access log
  useScrollToTop();   // Reset scroll on every route change
  return (
    <div className="min-h-screen flex flex-col bg-bg-page">
      <DemoDisclaimer />
      <AppHeader />
      <main className="flex-1" key={resetKey}>
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
}
