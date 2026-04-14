-- =========================================================================================
-- SCRIPT DE SEGURIDAD PARA SUPABASE - CGC SOFTWARE
-- IMPORTANTE: Ejecuta este script en el SQL Editor de tu panel de Supabase.
-- =========================================================================================

-- 1. Habilitar la Seguridad de Nivel de Fila (RLS) en todas las tablas existentes
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE trabajadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE planillas ENABLE ROW LEVEL SECURITY;
ALTER TABLE planilla_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE planilla_detalle_deducciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE deducciones_config ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas públicas anteriores (si las hubiese - ignora errores si no existen)
DROP POLICY IF EXISTS "Public Select" ON empresas;
DROP POLICY IF EXISTS "Public Insert" ON empresas;
-- Repetir para otras si tuvieras políticas previas sueltas.

-- 3. Crear Políticas de Autenticación Requerida.
-- Estas políticas aseguran que SOLO usuarios autenticados y con sesión activa (auth.uid() IS NOT NULL)
-- Puedan Leer, Insertar, Actualizar o Eliminar datos. ¡Esto previene cualquier inyección o acceso no autorizado!

-- EMPRESAS
CREATE POLICY "Permitir todo a usuarios autenticados en empresas" 
ON empresas FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);

-- PROYECTOS
CREATE POLICY "Permitir todo a usuarios autenticados en proyectos" 
ON proyectos FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);

-- TRABAJADORES
CREATE POLICY "Permitir todo a usuarios autenticados en trabajadores" 
ON trabajadores FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);

-- ASISTENCIAS
CREATE POLICY "Permitir todo a usuarios autenticados en asistencias" 
ON asistencias FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);

-- PLANILLAS
CREATE POLICY "Permitir todo a usuarios autenticados en planillas" 
ON planillas FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);

-- PLANILLA DETALLES
CREATE POLICY "Permitir todo a usuarios autenticados en planilla_detalles" 
ON planilla_detalles FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);

-- PLANILLA DETALLE DEDUCCIONES
CREATE POLICY "Permitir todo a usuarios autenticados en planilla_detalle_deducciones" 
ON planilla_detalle_deducciones FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);

-- DEDUCCIONES CONFIG
CREATE POLICY "Permitir todo a usuarios autenticados en deducciones_config" 
ON deducciones_config FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);

-- =========================================================================================
-- PASOS PARA CREAR AL ADMINISTRADOR:
-- 1. Ve a "Authentication" > "Users" en tu panel de Supabase.
-- 2. Haz clic en "Add User" > "Create New User".
-- 3. Ingresa tu correo (ej. admin@cgc.com) y una contraseña ultra segura.
-- 4. ¡Listo! Ya podrás iniciar sesión en la aplicación. No es necesario crear otra tabla.
-- =========================================================================================
