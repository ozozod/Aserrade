# 📋 Instrucciones para Crear Base de Datos de Desarrollo

## Opción 1: Desde Terminal SSH (Recomendado)

### Paso 1: Conectarse a MySQL

```bash
mysql -u root -p
```

Te pedirá la contraseña de MySQL.

### Paso 2: Crear la Base de Datos

Una vez dentro de MySQL, ejecutar:

```sql
CREATE DATABASE IF NOT EXISTS aserradero_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aserradero_dev;
```

### Paso 3: Copiar Estructura de Tablas desde Producción

En otra terminal SSH (sin estar dentro de MySQL):

```bash
# Exportar solo estructura (sin datos) de producción
mysqldump -u root -p --no-data aserradero_db > estructura_produccion.sql

# Cambiar nombre de base de datos en el archivo
sed -i 's/aserradero_db/aserradero_dev/g' estructura_produccion.sql

# Importar estructura en base de desarrollo
mysql -u root -p aserradero_dev < estructura_produccion.sql
```

### Paso 4: Crear Tablas de Usuarios y Auditoría

Dentro de MySQL:

```sql
USE aserradero_dev;
```

Luego copiar y pegar el contenido de `v1.2_usuarios_auditoria.sql` (desde la línea 7 en adelante, sin el CREATE DATABASE).

O desde terminal:

```bash
mysql -u root -p aserradero_dev < v1.2_usuarios_auditoria.sql
```

---

## Opción 2: Desde phpMyAdmin (Más Fácil)

1. **Ir a phpMyAdmin** en Hostinger
2. **Clic en "Nueva"** (crear base de datos)
3. **Nombre**: `aserradero_dev`
4. **Cotejamiento**: `utf8mb4_unicode_ci`
5. **Clic en "Crear"**

### Copiar Estructura de Tablas:

1. **Ir a base de datos `aserradero_db`** (producción)
2. **Clic en "Exportar"**
3. **Seleccionar**: Solo estructura (sin datos)
4. **Clic en "Continuar"**
5. **Abrir el archivo SQL descargado** en un editor
6. **Buscar y reemplazar**: `aserradero_db` → `aserradero_dev`
7. **Ir a base de datos `aserradero_dev`**
8. **Clic en "Importar"**
9. **Seleccionar el archivo SQL modificado**
10. **Clic en "Continuar"**

### Crear Tablas de Usuarios y Auditoría:

1. **Ir a base de datos `aserradero_dev`**
2. **Clic en "SQL"**
3. **Copiar y pegar** el contenido de `v1.2_usuarios_auditoria.sql` (desde línea 7, sin CREATE DATABASE)
4. **Clic en "Continuar"**

---

## ✅ Verificación

Para verificar que todo está correcto:

```sql
USE aserradero_dev;
SHOW TABLES;
```

Deberías ver:
- clientes
- articulos
- remitos
- remito_articulos
- pagos
- usuarios
- auditoria

```sql
SELECT * FROM usuarios;
```

Deberías ver el usuario admin creado.

---

## 🔐 Credenciales

- **Host**: `31.97.246.42`
- **Usuario MySQL**: `root` (o el usuario que tengas configurado)
- **Base de datos**: `aserradero_dev`

