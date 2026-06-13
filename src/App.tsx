import { useEffect } from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient, persister } from "@/lib/queryCache";
import FortCargasDashboard from './pages/FortCargasDashboard';

/** Remove the HTML splash screen once React mounts */
function useSplashRemoval() {
  useEffect(() => {
    const el = document.getElementById('splash-screen');
    if (el) {
      el.classList.add('hide');
      setTimeout(() => el.remove(), 500);
    }
  }, []);
}

function MainLayout() {
  useSplashRemoval();
  return <FortCargasDashboard />;
}

const App = () => (
  <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: 24 * 60 * 60 * 1000 }}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />} />
          <Route path="*" element={<MainLayout />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </PersistQueryClientProvider>
);

export default App;