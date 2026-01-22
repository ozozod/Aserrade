# Pasos para Configurar Supabase

## ✅ Ya Tienes:
- Proyecto creado en Supabase
- URL: https://uoisgayimsbqugablshq.supabase.co
- Anon Key: (ya la tienes)

## 📋 Pasos a Seguir:

### Paso 1: Crear las Tablas en Supabase

1. Ve a tu proyecto: https://supabase.com/dashboard
2. En el menú lateral, haz clic en **SQL Editor**
3. Haz clic en **New Query**
4. Abre el archivo `supabase/create_tables.sql` en tu proyecto
5. Copia TODO el contenido
6. Pégalo en el SQL Editor de Supabase
7. Haz clic en **Run** (o presiona `Ctrl+Enter`)
8. Deberías ver: **"Success. No rows returned"**

✅ **Verificar que se crearon:**
- Ve a **Table Editor** en el menú lateral
- Deberías ver 5 tablas: `clientes`, `articulos`, `remitos`, `remito_articulos`, `pagos`

---

### Paso 2: Instalar Dependencia en tu Proyecto

**En tu PC, en la carpeta del proyecto:**

```bash
cd C:\Users\ozozo\Documents\aserradero
npm install @supabase/supabase-js
```

---

### Paso 3: Verificar Configuración

El código ya está configurado con tu URL y key. Solo necesitas:

1. ✅ Las tablas creadas (Paso 1)
2. ✅ Dependencia instalada (Paso 2)

---

### Paso 4: Probar la Aplicación

```bash
npm run dev
```

**Deberías poder:**
- Ver la aplicación
- Crear clientes
- Crear artículos
- Crear remitos
- Todo se guarda en Supabase

---

## 🔍 Verificar que Funciona

1. **En la aplicación Electron:**
   - Crea un cliente de prueba
   - Debería guardarse sin errores

2. **En Supabase:**
   - Ve a **Table Editor** → `clientes`
   - Deberías ver el cliente que creaste

---

## ⚠️ Si Hay Errores

### Error: "relation does not exist"
- Las tablas no se crearon correctamente
- Vuelve al Paso 1 y crea las tablas

### Error: "permission denied"
- Las políticas RLS no están configuradas
- Verifica que ejecutaste TODO el script SQL

### Error: "Cannot find module '@supabase/supabase-js'"
- Ejecuta: `npm install @supabase/supabase-js`

---

## ✅ Checklist

- [ ] Tablas creadas en Supabase
- [ ] Dependencia `@supabase/supabase-js` instalada
- [ ] Aplicación inicia sin errores
- [ ] Puedo crear un cliente
- [ ] El cliente aparece en Supabase

---

**¿Ya creaste las tablas? Avísame y seguimos con el siguiente paso.**

