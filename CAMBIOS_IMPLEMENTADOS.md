# Cambios implementados

## Conexión real con Supabase
Se eliminó la dependencia de datos persistidos en navegador como fuente principal.

Ahora la app carga desde Supabase:
- empresa / configuración
- proyectos
- trabajadores
- asistencia
- deducciones
- planillas guardadas
- comprobantes

## Archivos nuevos
- `src/lib/supabase.ts` → capa REST para PostgREST de Supabase
- `src/lib/appData.ts` → carga inicial y mapeo de tablas
- `src/components/AppBootstrap.tsx` → inicializa la conexión y muestra errores de configuración
- `.env.example`

## Archivos modificados
- `src/store/useAppStore.ts` → store conectado a Supabase
- `src/pages/Workers.tsx`
- `src/pages/Projects.tsx`
- `src/pages/Attendance.tsx`
- `src/pages/Payroll.tsx`
- `src/pages/Receipts.tsx`
- `src/pages/Settings.tsx`
- `src/App.tsx`
- `supabase/schema_cgc.sql`
- `README.md`

## Base de datos
El SQL incluye:
- empresas
- proyectos
- trabajadores
- asistencias
- deducciones_config
- trabajador_deducciones
- planillas
- planilla_detalles
- planilla_detalle_deducciones
- recibos_pago

## Políticas
El SQL quedó con acceso `anon` y `authenticated` para funcionar directo desde el frontend con la `anon key`.

## Validación realizada
- validación TypeScript exitosa con `tsc --noEmit`

## Observación
El build completo con Vite no se pudo validar en este entorno porque el ZIP original trae un problema de dependencia opcional de Rollup para Linux. Eso normalmente se corrige al ejecutar `npm install` limpio en tu máquina.
