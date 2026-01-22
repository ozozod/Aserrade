# Configuración de Supabase - Paso a Paso

## Información del Proyecto
- **URL**: https://uoisgayimsbqugablshq.supabase.co
- **Anon Key**: (ya la tienes)

## Pasos de Configuración

### Paso 1: Crear las Tablas en Supabase

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Ve a **SQL Editor** (en el menú lateral)
3. Haz clic en **New Query**
4. Copia y pega el contenido del archivo `supabase/create_tables.sql`
5. Haz clic en **Run** (o presiona Ctrl+Enter)
6. Deberías ver "Success. No rows returned"

### Paso 2: Obtener las Keys

1. Ve a **Settings** → **API**
2. Anota:
   - **Project URL**: https://uoisgayimsbqugablshq.supabase.co
   - **anon public key**: (la que ya tienes)
   - **service_role key**: ⚠️ **NO la compartas, es secreta**

### Paso 3: Configurar Electron

El código ya está preparado para usar Supabase. Solo necesitas:
1. Instalar dependencia: `npm install @supabase/supabase-js`
2. Configurar las keys en el código

---

## Seguridad

- ✅ **anon key**: Es pública, se puede usar en el cliente (Electron)
- ❌ **service_role key**: Es SECRETA, solo para backend (no la uses en Electron)

---

## Próximos Pasos

1. Crear tablas (Paso 1)
2. Verificar que se crearon correctamente
3. Configurar Electron para conectarse

