# Instalación y Configuración de Supabase

## ✅ Ya Tienes:
- Proyecto creado en Supabase
- URL: https://uoisgayimsbqugablshq.supabase.co
- Anon Key configurada en el código

## 📋 Pasos para Completar:

### Paso 1: Crear las Tablas en Supabase

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. En el menú lateral, haz clic en **SQL Editor**
4. Haz clic en **New Query**
5. Abre el archivo `supabase/create_tables.sql` en tu proyecto
6. **Copia TODO el contenido** del archivo
7. Pégalo en el SQL Editor de Supabase
8. Haz clic en **Run** (o presiona `Ctrl+Enter`)
9. Deberías ver: **"Success. No rows returned"**

✅ **Verificar:**
- Ve a **Table Editor** en el menú lateral
- Deberías ver 5 tablas: `clientes`, `articulos`, `remitos`, `remito_articulos`, `pagos`

---

### Paso 2: Instalar Dependencia

**En PowerShell, en la carpeta del proyecto:**

```bash
cd C:\Users\ozozo\Documents\aserradero
npm install @supabase/supabase-js
```

---

### Paso 3: Probar la Aplicación

```bash
npm run dev
```

**Deberías poder:**
- ✅ Ver la aplicación
- ✅ Crear clientes
- ✅ Crear artículos  
- ✅ Crear remitos
- ✅ Todo se guarda en Supabase

---

## 🔍 Verificar que Funciona

1. **En la aplicación:**
   - Crea un cliente de prueba
   - Debería guardarse sin errores

2. **En Supabase:**
   - Ve a **Table Editor** → `clientes`
   - Deberías ver el cliente que creaste

---

## ⚠️ Si Hay Errores

### Error: "relation does not exist"
- Las tablas no se crearon
- Vuelve al Paso 1

### Error: "permission denied"
- Las políticas RLS no están configuradas
- Verifica que ejecutaste TODO el script SQL

### Error: "Cannot find module '@supabase/supabase-js'"
- Ejecuta: `npm install @supabase/supabase-js`

---

## ✅ Checklist Final

- [ ] Tablas creadas en Supabase (5 tablas)
- [ ] Dependencia instalada (`npm install @supabase/supabase-js`)
- [ ] Aplicación inicia sin errores
- [ ] Puedo crear un cliente
- [ ] El cliente aparece en Supabase

---

**¿Ya creaste las tablas? Si es así, instala la dependencia y prueba la app.**

