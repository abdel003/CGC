import { lazy, Suspense, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import AppBootstrap from "@/components/AppBootstrap";
import { supabase } from "@/lib/supabase";
import type { Session } from '@supabase/supabase-js';

// Lazy-loaded pages
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Workers = lazy(() => import("@/pages/Workers"));
const Projects = lazy(() => import("@/pages/Projects"));
const Attendance = lazy(() => import("@/pages/Attendance"));
const Payroll = lazy(() => import("@/pages/Payroll"));
const Receipts = lazy(() => import("@/pages/Receipts"));
const Settings = lazy(() => import("@/pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));

const LoadingFallback = () => (
  <div className="h-screen w-full flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
  </div>
);

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  // Ghost-Buster: Prevent UI freezes from stuck Radix/Shadcn pointer-events
  useEffect(() => {
    const cleanup = () => {
      const isDialogOpen = !!document.querySelector('[role="dialog"], [data-state="open"], .radix-overlay');
      if (!isDialogOpen && (document.body.style.pointerEvents === 'none' || document.body.style.overflow === 'hidden')) {
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflow = 'auto';
      }
    };
    
    // Run occasionally and on mutation
    const observer = new MutationObserver(cleanup);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });
    
    const interval = setInterval(cleanup, 1000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    supabase?.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase?.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    }) || { data: { subscription: { unsubscribe: () => {} } } };

    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return <LoadingFallback />;
  }

  if (!session) {
    return (
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Suspense fallback={<LoadingFallback />}>
          <Login />
        </Suspense>
      </TooltipProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <AppBootstrap />
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/trabajadores" element={<Workers />} />
                <Route path="/proyectos" element={<Projects />} />
                <Route path="/asistencia" element={<Attendance />} />
                <Route path="/planilla" element={<Payroll />} />
                <Route path="/comprobantes" element={<Receipts />} />
                <Route path="/configuracion" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
