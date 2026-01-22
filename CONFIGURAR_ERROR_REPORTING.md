# Configuración del Sistema de Reporte de Errores

## 📋 Descripción

El sistema de reporte de errores captura automáticamente todos los errores de JavaScript y React que ocurren en la aplicación y los envía a una base de datos Supabase separada para análisis y seguimiento.

## 🚀 Pasos de Configuración

### 1. Crear la tabla en Supabase

1. Ve a tu proyecto de Supabase: https://sunwgbrfumgfurmwjqkb.supabase.co
2. Navega a **SQL Editor**
3. Copia y pega el contenido del archivo `supabase/error_reports_table.sql`
4. Ejecuta el script SQL

### 2. Verificar la configuración

El archivo `src/config/errorReporting.js` ya está configurado con:
- URL del proyecto: `https://sunwgbrfumgfurmwjqkb.supabase.co`
- API Key: Configurada
- Tabla: `error_reports`
- Habilitado: `true`

### 3. Probar el sistema

Para probar que funciona, puedes:

1. **Probar manualmente desde la consola del navegador:**
```javascript
import { reportManualError } from './services/errorReportingService';
reportManualError('Error de prueba', { componentName: 'Test' });
```

2. **O forzar un error en algún componente** (solo para pruebas)

## 📊 Información Capturada

Cada error reportado incluye:

- **error_message**: Mensaje del error
- **error_stack**: Stack trace completo
- **error_type**: Tipo de error (TypeError, ReferenceError, etc.)
- **component_name**: Componente donde ocurrió
- **user_agent**: Información del navegador
- **url**: URL donde ocurrió
- **timestamp**: Fecha y hora
- **app_version**: Versión de la app
- **additional_data**: Datos adicionales (JSON)
  - Información de pantalla
  - Plataforma
  - Idioma
  - etc.

## 🔍 Ver Errores Reportados

### Opción 1: Desde Supabase Dashboard

1. Ve a tu proyecto de Supabase
2. Navega a **Table Editor**
3. Selecciona la tabla `error_reports`
4. Verás todos los errores reportados

### Opción 2: Consulta SQL

```sql
-- Ver todos los errores no resueltos
SELECT * FROM error_reports 
WHERE resolved = false 
ORDER BY timestamp DESC;

-- Ver errores por tipo
SELECT error_type, COUNT(*) 
FROM error_reports 
GROUP BY error_type;

-- Ver errores por componente
SELECT component_name, COUNT(*) 
FROM error_reports 
GROUP BY component_name;
```

## ✅ Marcar Errores como Resueltos

Puedes marcar errores como resueltos desde Supabase:

```sql
UPDATE error_reports 
SET resolved = true, 
    resolved_at = NOW(), 
    resolved_by = 'Tu Nombre',
    notes = 'Error corregido en la versión X.X.X'
WHERE id = [ID_DEL_ERROR];
```

O usar la función del servicio:

```javascript
import { markErrorAsResolved } from './services/errorReportingService';
await markErrorAsResolved(errorId, 'Tu Nombre', 'Notas sobre la resolución');
```

## 🛠️ Funciones Disponibles

### `reportError(error, context)`
Reporta un error automáticamente. Usado por el sistema interno.

### `reportManualError(message, context)`
Reporta un error manualmente desde código.

```javascript
import { reportManualError } from './services/errorReportingService';

try {
  // código que puede fallar
} catch (error) {
  await reportManualError('Error al procesar datos', {
    componentName: 'MiComponente',
    errorType: 'ProcessingError',
    datos: { /* datos relevantes */ }
  });
}
```

### `getUnresolvedErrors()`
Obtiene todos los errores no resueltos (útil para crear un panel de administración).

### `markErrorAsResolved(errorId, resolvedBy, notes)`
Marca un error como resuelto.

## 🔒 Seguridad

- El sistema usa la clave **anon/public** de Supabase
- Solo puede insertar datos, no puede leer ni modificar otros datos
- Los errores se almacenan en una base separada de los datos de producción
- No se capturan datos sensibles (contraseñas, tokens, etc.)

## ⚙️ Deshabilitar el Sistema

Si necesitas deshabilitar temporalmente el reporte de errores:

Edita `src/config/errorReporting.js`:

```javascript
export const ERROR_REPORTING_CONFIG = {
  // ...
  enabled: false, // Cambiar a false
  // ...
};
```

## 📝 Notas

- Los errores se reportan de forma asíncrona, no bloquean la aplicación
- Si falla el reporte, no afecta el funcionamiento de la app
- En desarrollo, los errores también se muestran en la consola
- El ErrorBoundary muestra una UI amigable cuando ocurre un error crítico

