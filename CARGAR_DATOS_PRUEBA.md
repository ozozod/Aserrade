# Cargar Datos de Prueba en Supabase

## 📋 Datos que se Cargarán

- **7 Clientes** (incluyendo "Denis Mercado")
- **6 Artículos/Productos** (diferentes tipos de cajones)
- **6 Remitos** con múltiples artículos cada uno
- **5 Pagos** registrados

## 🚀 Pasos para Cargar

### Paso 1: Ir a SQL Editor

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. En el menú lateral, haz clic en **SQL Editor**
4. Haz clic en **New Query**

### Paso 2: Copiar y Ejecutar el Script

1. Abre el archivo `supabase/datos_prueba.sql` en tu proyecto
2. **Copia TODO el contenido** del archivo
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **Run** (o presiona `Ctrl+Enter`)
5. Deberías ver: **"Success. No rows returned"**

### Paso 3: Verificar que se Cargaron

1. Ve a **Table Editor** en el menú lateral
2. Selecciona cada tabla y verifica:
   - **clientes**: Deberías ver 7 clientes
   - **articulos**: Deberías ver 6 artículos
   - **remitos**: Deberías ver 6 remitos
   - **remito_articulos**: Deberías ver múltiples artículos por remito
   - **pagos**: Deberías ver 5 pagos

## 📊 Datos que Verás en la App

### Clientes:
- Denis Mercado (con datos completos)
- María González
- Juan Pérez
- Carlos Rodríguez
- Ana Martínez
- Luis Fernández
- Sofía López

### Artículos:
- Cajón Estándar ($1500)
- Cajón Pequeño ($1200)
- Cajón Grande ($1800)
- Media Caja ($750)
- Cajón Premium ($2000)
- Cajón Exportación ($2200)

### Remitos:
- **REM-001**: Denis Mercado - Pendiente ($99,000)
- **REM-002**: María González - Pagado ($45,000)
- **REM-003**: Juan Pérez - Pago Parcial ($79,500 - pagó $50,000)
- **REM-004**: Carlos Rodríguez - Pendiente ($67,500)
- **REM-005**: Ana Martínez - Pagado ($24,000)
- **REM-006**: Luis Fernández - Pago Parcial ($78,000 - pagó $15,000)

## ✅ Después de Cargar

1. **Reinicia la aplicación** (si está corriendo)
2. **Ve a la sección Clientes** - Deberías ver 7 clientes
3. **Ve a la sección Artículos** - Deberías ver 6 artículos
4. **Ve a la sección Remitos** - Deberías ver 6 remitos con sus artículos
5. **Ve a la sección Pagos** - Deberías ver 5 pagos registrados
6. **Ve a Reportes** - Selecciona un cliente y verás su cuenta corriente completa

---

**¿Ya cargaste los datos? Si es así, reinicia la app y deberías ver todos los datos funcionando.**

