# Información Necesaria para Sistema de Reporte de Errores

Para implementar el sistema de reporte de errores con Supabase, necesito:

## Opción 1: Usar el mismo proyecto de Supabase (Más simple)

**Ventajas:**
- Ya lo tienes configurado
- No necesitas crear nada nuevo
- Todo en un solo lugar

**Necesito:**
1. Confirmación de que puedo usar el proyecto actual de Supabase
2. URL del proyecto: Ya la tienes: `https://uoisgayimsbqugablshq.supabase.co`
3. API Key anon: Ya la tienes en `src/config/supabase.js`

**Lo que haré:**
- Crear una tabla `error_reports` en tu proyecto Supabase actual
- La app enviará errores ahí
- Crear un dashboard simple para que veas los errores

## Opción 2: Crear un proyecto nuevo de Supabase para errores (Más separado)

**Ventajas:**
- Errores separados de datos de producción
- Más organización

**Necesito:**
1. Que crees un nuevo proyecto en Supabase (gratis)
2. La URL del nuevo proyecto
3. La API Key anon del nuevo proyecto

---

## Recomendación: 

**Usar el mismo proyecto (Opción 1)** porque:
- Es más simple
- Ya está configurado
- Los errores no ocupan mucho espacio
- Puedes separar después si quieres

**¿Qué prefieres?**

---

## Lo que Implementaré:

1. **Captura automática de errores**:
   - Errores de JavaScript
   - Errores de React
   - Errores de Electron

2. **Modal cuando ocurre un error**:
   - Mensaje amigable
   - Campo para que el usuario describa qué estaba haciendo
   - Botón "Enviar Reporte" / "Ignorar"

3. **Información capturada automáticamente**:
   - Tipo de error y mensaje
   - Stack trace completo
   - Componente donde ocurrió
   - Versión de la app
   - Sistema operativo
   - Fecha y hora

4. **Tabla en Supabase** para almacenar reportes

5. **Dashboard simple** (opcional, después) para ver errores

---

*Puedo empezar con el mismo proyecto que usas ahora si confirmas.*

