# 🗑️ Guía para Eliminar Todos los Datos e Imágenes

Esta guía te ayudará a eliminar **completamente** todos los datos de la base de datos y todas las imágenes almacenadas en Supabase Storage.

---

## ⚠️ ADVERTENCIA IMPORTANTE

**Esta operación es IRREVERSIBLE.** Una vez eliminados los datos e imágenes, **NO se pueden recuperar** a menos que tengas un backup.

**Antes de proceder, asegúrate de:**
- ✅ Tener un backup completo de los datos (SQL + imágenes)
- ✅ Estar seguro de que quieres eliminar TODO
- ✅ Tener las credenciales de Supabase configuradas

---

## 📋 Opciones para Eliminar Todo

Tienes **2 opciones** dependiendo de lo que necesites:

### Opción 1: Solo Datos de la Base de Datos (Rápido - SQL)
Elimina solo los datos de las tablas y reinicia los contadores. **NO elimina las imágenes.**

### Opción 2: Datos + Imágenes (Completo - Script Node.js)
Elimina **todo**: datos de las tablas, imágenes del Storage y reinicia contadores.

---

## 🚀 Opción 1: Eliminar Solo Datos (SQL)

Esta opción es más rápida pero **deja las imágenes en Supabase Storage** (seguirán ocupando espacio).

### Pasos:

1. **Abrir SQL Editor en Supabase**
   - Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
   - Navega a **SQL Editor** en el menú lateral

2. **Ejecutar el script SQL**
   - Abre el archivo: `supabase/limpiar_todo_reiniciar.sql`
   - Copia y pega todo el contenido en el SQL Editor
   - Haz clic en **RUN** (o presiona `Ctrl + Enter`)

3. **Verificar la limpieza**
   - El script mostrará mensajes de confirmación
   - Verás estadísticas de cada tabla (deberían estar en 0)
   - Los contadores se reinician a 1

### Archivo a usar:
```
supabase/limpiar_todo_reiniciar.sql
```

### Qué hace:
- ✅ Elimina todos los registros de las tablas: `pagos`, `remito_articulos`, `remitos`, `articulos`, `clientes`
- ✅ Reinicia todas las secuencias (contadores) a 1
- ❌ **NO elimina las imágenes** del Storage

### Si quieres eliminar las imágenes después:
Sigue la **Opción 2** para eliminar también las imágenes.

---

## 🚀 Opción 2: Eliminar Datos + Imágenes (Completo)

Esta opción elimina **TODO**: datos de las tablas, imágenes del Storage y reinicia contadores.

### Pasos:

1. **Abrir una terminal en la carpeta del proyecto**
   ```bash
   cd C:\Users\ozozo\Documents\aserradero
   ```

2. **Ejecutar el script de limpieza completa**
   ```bash
   node scripts/limpiar-todo-con-imagenes.js
   ```

3. **Seguir las instrucciones del script**
   - El script te mostrará el progreso
   - Primero borrará las imágenes
   - Luego borrará los datos
   - Finalmente intentará reiniciar los contadores

4. **Si los contadores no se reinician automáticamente**
   - El script te indicará que ejecutes el SQL manualmente
   - Ve a Supabase SQL Editor
   - Ejecuta: `supabase/limpiar_todo_reiniciar.sql`

### Archivo a usar:
```
scripts/limpiar-todo-con-imagenes.js
```

### Qué hace:
- ✅ Elimina **todas las imágenes** del bucket `remitos-fotos` en Supabase Storage
- ✅ Elimina todos los registros de las tablas: `pagos`, `remito_articulos`, `remitos`, `articulos`, `clientes`
- ✅ Intenta reiniciar todas las secuencias (contadores) a 1
- ✅ Verifica que todo esté limpio

### Requisitos:
- ✅ Node.js instalado
- ✅ Credenciales de Supabase configuradas en `.env` o `config.json`
- ✅ Tener instalado el paquete `@supabase/supabase-js`

---

## 🔍 Verificación Post-Limpieza

Después de ejecutar cualquiera de las opciones, verifica que todo esté limpio:

### Verificar datos en Supabase:
1. Ve a **Table Editor** en Supabase Dashboard
2. Verifica que las tablas estén vacías:
   - `clientes` → 0 registros
   - `articulos` → 0 registros
   - `remitos` → 0 registros
   - `remito_articulos` → 0 registros
   - `pagos` → 0 registros

### Verificar imágenes en Storage:
1. Ve a **Storage** en Supabase Dashboard
2. Abre el bucket `remitos-fotos`
3. Verifica que esté vacío (solo puede haber un archivo `.emptyFolderPlaceholder`)

### Verificar contadores:
Ejecuta este SQL en Supabase SQL Editor:
```sql
SELECT 
    'clientes' as tabla,
    (SELECT COUNT(*) FROM clientes) as registros,
    COALESCE((SELECT last_value FROM clientes_id_seq), 0) as siguiente_id
UNION ALL
SELECT 
    'articulos' as tabla,
    (SELECT COUNT(*) FROM articulos) as registros,
    COALESCE((SELECT last_value FROM articulos_id_seq), 0) as siguiente_id
UNION ALL
SELECT 
    'remitos' as tabla,
    (SELECT COUNT(*) FROM remitos) as registros,
    COALESCE((SELECT last_value FROM remitos_id_seq), 0) as siguiente_id
UNION ALL
SELECT 
    'remito_articulos' as tabla,
    (SELECT COUNT(*) FROM remito_articulos) as registros,
    COALESCE((SELECT last_value FROM remito_articulos_id_seq), 0) as siguiente_id
UNION ALL
SELECT 
    'pagos' as tabla,
    (SELECT COUNT(*) FROM pagos) as registros,
    COALESCE((SELECT last_value FROM pagos_id_seq), 0) as siguiente_id;
```

Los `siguiente_id` deberían ser 1 o muy cercanos a 1.

---

## 📝 Resumen de Archivos

| Archivo | Qué hace | Cuándo usarlo |
|---------|----------|---------------|
| `supabase/limpiar_todo_reiniciar.sql` | Elimina solo datos de tablas y reinicia contadores | Cuando quieres limpiar datos rápido, pero mantener imágenes |
| `scripts/limpiar-todo-con-imagenes.js` | Elimina datos + imágenes + reinicia contadores | Cuando quieres una limpieza completa de todo |

---

## 💡 Consejos

### Antes de eliminar:
1. **Haz un backup completo**
   ```bash
   node scripts/backup-completo-con-imagenes.js
   ```
   Esto guardará SQL + imágenes en tu carpeta local (y opcionalmente en Google Drive o Hostinger).

2. **Verifica el backup**
   - Asegúrate de que el backup se haya generado correctamente
   - Revisa que tenga datos e imágenes

### Después de eliminar:
1. **Verifica que todo esté limpio** (ver sección de verificación arriba)
2. **Si quieres agregar datos de prueba**, ejecuta:
   - `supabase/datos_prueba_80_clientes.sql` → Para agregar ~80 clientes con remitos
   - `supabase/datos_prueba_realistas.sql` → Para agregar datos de prueba más básicos

---

## ❓ Problemas Comunes

### Error: "Variables de entorno SUPABASE no configuradas"
**Solución:** Asegúrate de tener las credenciales en `.env` o `config.json`:
```env
REACT_APP_SUPABASE_URL=https://tu-proyecto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=tu-clave-aqui
```

### Error: "No se puede reiniciar secuencia automáticamente"
**Solución:** Esto es normal. Ejecuta manualmente `supabase/limpiar_todo_reiniciar.sql` en Supabase SQL Editor.

### Las imágenes no se borran
**Solución:** Verifica que tengas permisos en Supabase Storage. El script necesita acceso de lectura/escritura al bucket `remitos-fotos`.

### Quedan datos después de la limpieza
**Solución:** 
1. Verifica que no haya errores en la ejecución
2. Si usaste la Opción 1, ejecuta la Opción 2 para limpiar también las imágenes
3. Si aún quedan datos, ejecuta el SQL manualmente en Supabase

---

## 📚 Archivos Relacionados

- `supabase/limpiar_todo_reiniciar.sql` → Script SQL para limpiar datos
- `scripts/limpiar-todo-con-imagenes.js` → Script Node.js para limpiar todo (datos + imágenes)
- `scripts/backup-completo-con-imagenes.js` → Script para hacer backup antes de limpiar
- `RESTAURAR_BACKUP.md` → Guía para restaurar un backup después de limpiar

---

## ✅ Checklist de Limpieza

Usa este checklist para asegurarte de hacer todo correctamente:

- [ ] Hecho un backup completo (SQL + imágenes)
- [ ] Verificado que el backup funciona
- [ ] Decidido qué opción usar (Solo datos o Datos + Imágenes)
- [ ] Ejecutado el script correspondiente
- [ ] Verificado que las tablas estén vacías
- [ ] Verificado que las imágenes estén eliminadas (si usé Opción 2)
- [ ] Verificado que los contadores estén en 1
- [ ] Listo para agregar nuevos datos de prueba

---

## 🎯 Próximos Pasos

Después de limpiar todo:

1. **Agregar datos de prueba:**
   - Ejecuta `supabase/datos_prueba_80_clientes.sql` para agregar ~80 clientes con remitos

2. **O empezar desde cero:**
   - Comienza a agregar clientes y remitos desde la aplicación

---

**¿Necesitas ayuda?** Revisa los archivos de documentación o los comentarios en los scripts.


