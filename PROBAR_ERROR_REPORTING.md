# 🧪 Guía para Probar el Sistema de Reporte de Errores

## Paso 1: Crear la tabla en Supabase

1. **Abre tu proyecto de Supabase:**
   - Ve a: https://sunwgbrfumgfurmwjqkb.supabase.co
   - Inicia sesión si es necesario

2. **Abre el SQL Editor:**
   - En el menú lateral izquierdo, haz clic en **"SQL Editor"**
   - O ve directamente a: https://supabase.com/dashboard/project/sunwgbrfumgfurmwjqkb/sql/new

3. **Copia el script SQL:**
   - Abre el archivo `supabase/error_reports_table.sql` en tu editor
   - Copia TODO el contenido (Ctrl+A, Ctrl+C)

4. **Pega y ejecuta:**
   - Pega el contenido en el SQL Editor de Supabase
   - Haz clic en el botón **"Run"** o presiona **Ctrl+Enter**
   - Deberías ver un mensaje de éxito: "Success. No rows returned"

5. **Verifica que la tabla se creó:**
   - Ve a **"Table Editor"** en el menú lateral
   - Deberías ver la tabla `error_reports` en la lista

## Paso 2: Iniciar la aplicación

1. **Abre la terminal** en la carpeta del proyecto
2. **Ejecuta:**
   ```bash
   npm run dev
   ```
3. **Espera** a que la app se abra en Electron

## Paso 3: Probar el sistema (3 formas)

### Prueba 1: Error desde la consola del navegador

1. **Abre la consola de desarrollador:**
   - Presiona **F12** (si DevTools está habilitado en desarrollo)
   - O ve a: `View` → `Toggle Developer Tools`

2. **En la consola, escribe y presiona Enter:**
   ```javascript
   throw new Error("Error de prueba desde consola")
   ```

3. **Verifica:**
   - Deberías ver el error en la consola
   - Espera 2-3 segundos
   - Ve a Supabase → Table Editor → `error_reports`
   - Deberías ver un nuevo registro con tu error

### Prueba 2: Error desde un componente (más realista)

1. **Abre cualquier pestaña** de la app (ej: Remitos, Clientes, etc.)

2. **En la consola del navegador, escribe:**
   ```javascript
   // Esto simula un error en un componente
   window.testError = () => {
     throw new TypeError("Error de prueba en componente");
   };
   testError();
   ```

3. **Verifica en Supabase** que se guardó el error

### Prueba 3: Usar el botón de prueba (más fácil)

1. **En la app, abre la consola** (F12)

2. **Escribe esto:**
   ```javascript
   // Importar el servicio (si está disponible globalmente)
   // O mejor, desde la consola de React DevTools
   ```

   **O mejor aún**, vamos a crear un botón de prueba en la app (ver siguiente sección)

## Paso 4: Verificar los errores en Supabase

1. **Ve a Supabase Dashboard:**
   - https://sunwgbrfumgfurmwjqkb.supabase.co

2. **Abre Table Editor:**
   - Menú lateral → **"Table Editor"**
   - Selecciona la tabla **`error_reports`**

3. **Deberías ver:**
   - Una fila por cada error reportado
   - Columnas con: error_message, error_type, component_name, timestamp, etc.
   - Los errores más recientes aparecen primero

4. **Haz clic en una fila** para ver todos los detalles:
   - `error_stack`: Stack trace completo
   - `additional_data`: Información del navegador, pantalla, etc.
   - `user_agent`: Información del navegador

## Paso 5: Consultas útiles en Supabase

En el **SQL Editor** de Supabase, puedes ejecutar estas consultas:

### Ver todos los errores no resueltos:
```sql
SELECT * FROM error_reports 
WHERE resolved = false 
ORDER BY timestamp DESC 
LIMIT 50;
```

### Contar errores por tipo:
```sql
SELECT error_type, COUNT(*) as cantidad
FROM error_reports 
GROUP BY error_type
ORDER BY cantidad DESC;
```

### Contar errores por componente:
```sql
SELECT component_name, COUNT(*) as cantidad
FROM error_reports 
GROUP BY component_name
ORDER BY cantidad DESC;
```

### Ver errores de hoy:
```sql
SELECT * FROM error_reports 
WHERE DATE(timestamp) = CURRENT_DATE
ORDER BY timestamp DESC;
```

## ✅ Verificación final

Si todo funciona correctamente:

1. ✅ La tabla `error_reports` existe en Supabase
2. ✅ Los errores se guardan automáticamente
3. ✅ Puedes ver los errores en Supabase
4. ✅ La app sigue funcionando normalmente (los errores no la bloquean)

## 🐛 Solución de problemas

### Si no se crean errores:
- Verifica que `enabled: true` en `src/config/errorReporting.js`
- Revisa la consola del navegador por errores de conexión
- Verifica que la URL y API key sean correctas

### Si hay errores de conexión:
- Verifica que la URL de Supabase sea correcta
- Verifica que la API key sea válida
- Asegúrate de que la tabla `error_reports` exista

### Si la app no inicia:
- Revisa la consola por errores de importación
- Verifica que `@supabase/supabase-js` esté instalado: `npm list @supabase/supabase-js`

## 📝 Nota importante

- Los errores se reportan de forma **asíncrona** (no bloquean la app)
- Si falla el reporte, no afecta el funcionamiento de la aplicación
- Los errores se guardan automáticamente, no necesitas hacer nada más

