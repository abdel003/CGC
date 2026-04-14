# Prompt para Stitch — Mejora de Diseño: CGC Enterprise Suite

## Contexto de la Aplicación
Aplicación web SaaS de gestión de construcción (nómina, asistencia, trabajadores, proyectos). Stack: React + TypeScript + Tailwind CSS. Desktop-first con soporte mobile.

---

## Diseño Actual (describe lo que tienes)

### Paleta de Colores actual
- **Fondo global:** `hsl(210 20% 98%)` — blanco grisáceo muy claro
- **Cards:** `#FFFFFF` blanco puro con borde `hsl(214 20% 91%)` y sombra muy sutil
- **Sidebar:** Degradado azul marino oscuro `hsl(215 50% 16%)` → `hsl(215 55% 11%)`
- **Color primario/acento:** Azul `hsl(217 91% 60%)` (#3B82F6) para botones, íconos activos
- **Texto principal:** `hsl(215 28% 10%)` casi negro
- **Texto secundario/muted:** `hsl(215 16% 47%)` gris medio

### Tipografía actual
- Una sola fuente: **Inter** para todo (títulos y cuerpo)
- Tamaños: `text-2xl font-bold` para títulos de página, `text-sm` para cuerpo, `text-xs` para labels

### Layout actual
- **Sidebar izquierdo fijo:** 260px de ancho, colapsable a 72px, fondo azul oscuro degradado
- **Header superior:** Fondo blanco, barra de búsqueda, bell icon con dot animado, avatar "AD"
- **Área de contenido:** Padding 24px, fondo gris muy claro, max-width 1400px centrado
- **Mobile:** Sidebar como drawer + botón hamburguesa. Sin bottom nav

### Componentes actuales

**Dashboard:**
- Banner de bienvenida: gradiente azul `#2563EB → #1D4ED8 → #1E40AF` con texto blanco y círculos decorativos semitransparentes
- 4 KPI cards en grid 2x2 (mobile) / 4 columnas (desktop): cada una con ícono en cuadrado con gradiente de color, número grande, label pequeño debajo. Sin separadores, sombra muy sutil
- **Gráfico de barras** "Tendencia de Asistencia Semanal": barras azul `#3B82F6` (Presentes) y gris claro `#E2E8F0` (Ausentes), grid horizontal, sin líneas verticales, bordes redondeados arriba, tooltip custom blanco
- **Donut chart** "Distribución por cargo": rosquilla delgada, colores múltiples, sin label central
- Acciones Rápidas: 3 filas con ícono en cuadrado de color, título, subtítulo y flecha con hover effect. Fondos: azul-50, emerald-50, amber-50
- Actividad Reciente: lista con avatar circular letra inicial, nombre+cargo+fecha, badge de estado coloreado

**Workers (Trabajadores):**
- Filtros: buscador con ícono lupa + select de estado + select de proyecto + toggle grid/tabla
- Vista Grid: cards con avatar cuadrado azul (inicial), badge de estado, dos mini-cards azul-50 con info, detalles de proyecto/ingreso, botones Ver/Editar/Eliminar
- Vista Tabla: columnas básicas con badge de estado

**Sidebar:**
- Logo "CGC" en cuadrado azul con ícono `Building2`
- Secciones "Principal" y "Sistema" con texto uppercase tracking-widest
- Items activos: `bg-white/10 text-white` + indicador izquierdo de 3px azul vertical
- Items inactivos: `text-blue-200/70 hover:bg-white/5`
- Footer con botón "Colapsar" y versión

**Estadísticas (StatCard):**
- Ícono en cuadrado de `44px` con gradiente (azul, verde, rojo, amarillo)
- Número animado `text-2xl font-bold`
- Label `text-xs text-muted-foreground`

### Bordes y formas
- Cards: `rounded-xl` (12px)
- Avatares: `rounded-xl` cuadrados o `rounded-full` circular
- Botones: `rounded-lg` (8px)
- Inputs: `rounded-lg`

### Sombras
- Cards: `shadow-sm` + `hover:shadow-lg hover:-translate-y-0.5`
- Sidebar: `shadow-sidebar`

---

## Lo que quiero mejorar (instrucciones para Stitch)

Mantén la estructura y funcionalidad exactamente igual. Solo mejora la estética visual hacia un estilo **"Premium SaaS Enterprise"** más moderno. Específicamente:

1. **Tipografía dual:** Usa **Manrope** (bold/semibold) para todos los títulos de sección, KPI numbers y nombres de páginas. Mantén **Inter** para cuerpo de texto, labels y datos de tabla. Esto crea jerarquía visual inmediata.

2. **Sidebar upgrade:** Mantén el azul oscuro pero agrégale una separación más limpia. El logo debería tener un borde interior sutil. Los items de nav deben tener un hover state más visible (fondo con más opacidad). El indicador activo de 3px podría ser un gradiente azul brillante.

3. **KPI Cards más impactantes:** Los números deben ser más grandes (`text-3xl` o `text-4xl`), con una línea de color en la parte superior izquierda o un acento de color más visible. Considera agregar micro-trend indicators (↑ 4.3% esta semana) en texto pequeño bajo el label.

4. **Welcome Banner mejorado:** El banner actual ya es bueno. Mejorar con: una textura sutil de patrón geométrico (dots o líneas diagonales) semitransparente encima del gradiente, y quick-stats flotantes con fondo `bg-white/15 backdrop-blur-sm` más estilizados.

5. **Gráfico de barras — mantener igual pero:** El chart actual es perfecto visualmente. Solo asegurarse que el tooltip sea más polished (border-radius mayor, shadow más pronunciada).

6. **Cards de acciones rápidas:** Cambiar de `rounded-xl` a `rounded-2xl`, agregar un borde izquierdo de 4px del color correspondiente (azul, verde, ámbar). El ícono podría tener un glow sutil del mismo color.

7. **Estados y badges:** Unificar el estilo de badges a píldoras más pequeñas con dot de color a la izquierda (como: `● Activo`).

8. **Header superior:** Agregar un separador más visible entre el breadcrumb y los controles. La barra de búsqueda debería tener un estado focused más pronunciado (ring azul visible).

9. **Efecto de profundidad general:** El fondo de la página podría ser marginalmente más oscuro (`slate-100` en vez de casi blanco) para que las cards blancas "floten" más visiblemente sobre él.

10. **Mobile bottom nav:** Agregar una barra de navegación inferior para mobile con los 4 íconos principales (Dashboard, Trabajadores, Asistencia, Planilla) con indicador activo.

---

## Restricciones importantes
- NO cambiar la arquitectura de componentes ni el routing
- NO cambiar los colores de estado: emerald=presente, red=falta, amber=permiso, blue=incapacidad
- NO cambiar el gráfico de barras (ya está perfecto)
- Mantener compatibilidad con Tailwind CSS v3
- Todos los textos siguen en español
- Mantener la funcionalidad de imprimir recibos (print styles críticos)
