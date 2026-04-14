# CGC con Supabase

Este proyecto ya quedó conectado a Supabase para que los datos no salgan del navegador ni de mocks locales.

## Qué viene desde la base de datos
- empresa / configuración
- proyectos
- trabajadores
- asistencia diaria
- deducciones configurables
- planillas guardadas
- comprobantes basados en planillas guardadas

## Variables de entorno
Crea un archivo `.env` en la raíz usando este formato:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon
```

## Pasos para levantarlo
1. En Supabase, abre **SQL Editor**.
2. Ejecuta el archivo `supabase/schema_cgc.sql`.
3. Crea el archivo `.env` con tus credenciales.
4. Instala dependencias:
   ```bash
   npm install
   ```
5. Ejecuta el proyecto:
   ```bash
   npm run dev
   ```

## Nota sobre la base
- Si no existe una empresa base, la app la crea automáticamente.
- Si no existen deducciones iniciales, la app crea las tres deducciones base.
- Las políticas del SQL quedaron abiertas para `anon` y `authenticated` para que funcione directo desde el frontend.
- Para producción, conviene restringir esas políticas por usuario o por empresa.

## Importante
El ZIP original traía un problema con una dependencia opcional de Rollup en Linux. Por eso la validación fuerte que pude hacer aquí fue con TypeScript (`tsc --noEmit`). Cuando ejecutes `npm install` limpio en tu máquina, Vite debería reinstalar correctamente esa parte.
