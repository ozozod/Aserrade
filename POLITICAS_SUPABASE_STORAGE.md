# Políticas de Seguridad para Supabase Storage - Configuración Exacta

## 📋 Configuración de Políticas para el Bucket `remitos-fotos`

### ⚠️ IMPORTANTE: Qué escribir en "Policy definition"

En el campo **Policy definition**, solo debes escribir la expresión SQL. No escribas "sql" ni otras palabras, solo la condición.

---

## 🔓 Política 1: Lectura Pública (SELECT)

**Configuración:**
- **Policy name**: `Allow public read`
- **Allowed operation**: ✅ **SELECT** (solo este marcado)
- **Target roles**: Dejar vacío (será público)
- **Policy definition**: 
```
true
```

**Explicación**: Permite que cualquier persona pueda leer/ver las imágenes desde la URL pública.

---

## 📤 Política 2: Subida Permitida (INSERT)

**Configuración:**
- **Policy name**: `Allow authenticated upload`
- **Allowed operation**: ✅ **INSERT** (solo este marcado)
- **Target roles**: `authenticated` (o dejar vacío para permitir a todos)
- **Policy definition**:
```
bucket_id = 'remitos-fotos'
```

**Explicación**: Permite subir imágenes al bucket.

---

## ✏️ Política 3: Actualización Permitida (UPDATE)

**Configuración:**
- **Policy name**: `Allow authenticated update`
- **Allowed operation**: ✅ **UPDATE** (solo este marcado)
- **Target roles**: `authenticated` (o dejar vacío para permitir a todos)
- **Policy definition**:
```
bucket_id = 'remitos-fotos'
```

**Explicación**: Permite actualizar/reemplazar imágenes existentes.

---

## 🗑️ Política 4: Eliminación Permitida (DELETE)

**Configuración:**
- **Policy name**: `Allow authenticated delete`
- **Allowed operation**: ✅ **DELETE** (solo este marcado)
- **Target roles**: `authenticated` (o dejar vacío para permitir a todos)
- **Policy definition**:
```
bucket_id = 'remitos-fotos'
```

**Explicación**: Permite eliminar imágenes del bucket.

---

## ✅ Configuración Simplificada (Recomendada)

Si quieres que funcione sin autenticación (más simple), usa estas políticas:

### Política 1: Lectura Pública
- **Policy name**: `Public read`
- **Allowed operation**: SELECT
- **Target roles**: (vacío)
- **Policy definition**: `true`

### Política 2: Escritura Pública (solo para desarrollo)
- **Policy name**: `Public write`
- **Allowed operation**: INSERT
- **Target roles**: (vacío)
- **Policy definition**: `true`

### Política 3: Actualización Pública
- **Policy name**: `Public update`
- **Allowed operation**: UPDATE
- **Target roles**: (vacío)
- **Policy definition**: `true`

### Política 4: Eliminación Pública
- **Policy name**: `Public delete`
- **Allowed operation**: DELETE
- **Target roles**: (vacío)
- **Policy definition**: `true`

---

## 📝 Notas Importantes

1. **En Policy definition**: Solo escribe la condición SQL, sin comillas adicionales si es texto.
2. **Para `true`**: Escribe solo `true` (sin comillas).
3. **Para bucket_id**: Escribe `bucket_id = 'remitos-fotos'` (con comillas simples en el nombre del bucket).
4. **Target roles vacío**: Significa que aplica a todos (público).
5. **Target roles `authenticated`**: Solo para usuarios autenticados.

---

## 🎯 Recomendación Final

Para que funcione más fácil, usa todas las políticas con:
- **Policy definition**: `true`
- **Target roles**: (vacío - público)

Esto permitirá que la app funcione sin necesidad de autenticación adicional.

---

*Una vez configuradas las políticas, la app podrá subir, leer y eliminar imágenes automáticamente.*

