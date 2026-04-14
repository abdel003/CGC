import { useEffect } from 'react';
import { AlertCircle, Database, LoaderCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AppBootstrap() {
  const initialize = useAppStore(s => s.initialize);
  const loading = useAppStore(s => s.loading);
  const initialized = useAppStore(s => s.initialized);
  const error = useAppStore(s => s.error);
  const isConfigured = useAppStore(s => s.isConfigured);

  useEffect(() => {
    if (!initialized && !loading) {
      void initialize();
    }
  }, [initialize, initialized, loading]);

  if (!initialized && loading) {
    return (
      <div className="min-h-[220px] flex items-center justify-center px-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <LoaderCircle className="w-5 h-5 animate-spin" />
          Cargando datos desde Supabase...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-amber-200 bg-amber-50 text-amber-900 mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{isConfigured ? 'No se pudo cargar Supabase' : 'Configura Supabase'}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{error}</p>
          {!isConfigured ? (
            <div className="text-xs space-y-1 font-mono bg-white/70 border border-amber-200 rounded-lg p-3">
              <p>VITE_SUPABASE_URL=https://tu-proyecto.supabase.co</p>
              <p>VITE_SUPABASE_ANON_KEY=tu_clave_anon</p>
            </div>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => void initialize()} className="gap-2">
            <Database className="w-4 h-4" /> Reintentar conexión
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
