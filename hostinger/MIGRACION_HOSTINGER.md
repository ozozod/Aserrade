# Guía de Migración a Hostinger

## Paso 1: Preparar la Base de Datos en Hostinger

### 1.1 Acceder a Hostinger
1. Inicia sesión en tu panel de Hostinger
2. Ve a la sección de "Bases de Datos" o "MySQL Databases"
3. Crea una nueva base de datos (ej: `aserradero_db`)
4. Crea un usuario y contraseña para la base de datos
5. Anota las credenciales:
   - Host: (generalmente `localhost` o una IP específica)
   - Usuario: 
   - Contraseña:
   - Nombre de base de datos:

### 1.2 Crear las Tablas
1. Accede a phpMyAdmin desde el panel de Hostinger
2. Selecciona tu base de datos
3. Ve a la pestaña "SQL"
4. Copia y pega el contenido de `create_tables_mysql.sql`
5. Ejecuta el script

## Paso 2: Exportar Datos desde Supabase

### 2.1 Exportar desde Supabase Dashboard
1. Ve a tu proyecto en Supabase
2. Navega a "Table Editor"
3. Para cada tabla (clientes, articulos, remitos, remito_articulos, pagos):
   - Haz clic en la tabla
   - Haz clic en "..." (tres puntos) → "Export data"
   - Descarga como CSV o JSON

### 2.2 Usar Script de Migración (Recomendado)
Ejecuta el script `migrar_datos_supabase_a_hostinger.js` que:
- Se conecta a Supabase
- Extrae todos los datos
- Los formatea para MySQL
- Genera un script SQL de inserción

## Paso 3: Importar Datos a Hostinger

### 3.1 Usando phpMyAdmin
1. Accede a phpMyAdmin
2. Selecciona tu base de datos
3. Ve a la pestaña "Importar"
4. Selecciona el archivo SQL generado
5. Haz clic en "Continuar"

### 3.2 Verificar Importación
Ejecuta estas consultas para verificar:
```sql
SELECT COUNT(*) FROM clientes;
SELECT COUNT(*) FROM articulos;
SELECT COUNT(*) FROM remitos;
SELECT COUNT(*) FROM remito_articulos;
SELECT COUNT(*) FROM pagos;
```

## Paso 4: Configurar la Aplicación

### 4.1 Actualizar Configuración
1. Edita `src/config/hostinger.js` (se creará)
2. Ingresa las credenciales de Hostinger
3. Actualiza `src/services/hostingerService.js` para usar MySQL

### 4.2 Probar Conexión
Ejecuta la app y verifica que se conecte correctamente a Hostinger.

## Notas Importantes

- **Backup**: Siempre haz backup de Supabase antes de migrar
- **Pruebas**: Prueba primero en un entorno de desarrollo
- **Decimales**: MySQL usa DECIMAL(15,2) para montos grandes
- **Charset**: Usamos utf8mb4 para soportar emojis y caracteres especiales

