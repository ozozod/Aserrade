# Conectar Hostinger MySQL desde Cursor

## Método 1: Extensión MySQL (Más Fácil)

### Instalación:
1. En Cursor, presiona `Ctrl+Shift+X` (o `Cmd+Shift+X` en Mac)
2. Busca "MySQL" (por WeChat o cweijan)
3. Instala la extensión

### Configuración:
1. Presiona `Ctrl+Shift+P` (o `Cmd+Shift+P`)
2. Escribe: `MySQL: Add Connection`
3. Completa el formulario:
   ```
   Connection Name: Hostinger Aserradero
   Host: (el host que te dio Hostinger, puede ser localhost o una IP)
   Port: 3306
   User: (tu usuario MySQL)
   Password: (tu contraseña MySQL)
   Database: (nombre de tu base de datos, ej: aserradero_db)
   ```
4. Guarda la conexión

### Usar:
- Presiona `Ctrl+Shift+P`
- Escribe: `MySQL: Connect`
- Selecciona "Hostinger Aserradero"
- Ahora puedes ejecutar queries directamente desde Cursor

## Método 2: Terminal con MySQL CLI

Si tienes acceso SSH a Hostinger:

```bash
# Conectar desde terminal
mysql -h [HOST] -u [USUARIO] -p [BASE_DE_DATOS]
```

## Método 3: Desde la App (Para desarrollo)

Podemos configurar la app para que se conecte directamente a Hostinger usando el servicio `hostingerService.js`.

### Pasos:
1. Crea un archivo `config.json` en la raíz del proyecto (basado en `hostinger/config.example.json`)
2. Completa las credenciales de MySQL
3. La app usará estas credenciales para conectarse

## Obtener Credenciales de Hostinger

1. Inicia sesión en tu panel de Hostinger
2. Ve a "Bases de Datos" o "MySQL Databases"
3. Busca tu base de datos
4. Verás:
   - **Host**: Generalmente `localhost` o una IP específica
   - **Usuario**: El usuario MySQL
   - **Contraseña**: (puedes resetearla si no la recuerdas)
   - **Base de datos**: El nombre de tu BD

## Prueba de Conexión

Una vez configurado, puedes probar con:

```sql
SELECT COUNT(*) FROM clientes;
SELECT COUNT(*) FROM articulos;
SELECT COUNT(*) FROM remitos;
```

Si funciona, verás los números de registros en cada tabla.

