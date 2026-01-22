# Migración a Hostinger

Este directorio contiene todos los scripts y documentación necesarios para migrar la base de datos desde Supabase a Hostinger.

## Archivos

- `create_tables_mysql.sql` - Script para crear las tablas en MySQL (Hostinger)
- `migrar_datos_supabase_a_hostinger.js` - Script Node.js para migrar datos automáticamente
- `MIGRACION_HOSTINGER.md` - Guía paso a paso de migración
- `.env.example` - Plantilla de configuración

## Pasos Rápidos

### 1. Preparar Hostinger
1. Crea la base de datos en el panel de Hostinger
2. Anota las credenciales (host, usuario, contraseña, nombre de BD)
3. Accede a phpMyAdmin y ejecuta `create_tables_mysql.sql`

### 2. Migrar Datos
1. Copia `.env.example` a `.env`
2. Completa las credenciales de Supabase y MySQL
3. Instala dependencias: `npm install mysql2 @supabase/supabase-js dotenv`
4. Ejecuta: `node migrar_datos_supabase_a_hostinger.js`

### 3. Verificar
- Revisa que todos los datos se hayan migrado correctamente
- Compara conteos entre Supabase y MySQL

## Notas

- Haz backup de Supabase antes de migrar
- Prueba primero en un entorno de desarrollo
- Los archivos SQL generados se guardan en este directorio

