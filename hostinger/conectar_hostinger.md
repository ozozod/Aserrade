# Conectar Hostinger desde Cursor

Hay varias formas de conectar la base de datos de Hostinger desde Cursor:

## Opción 1: Extensión MySQL en Cursor/VS Code (Recomendado)

### Pasos:
1. Instala la extensión "MySQL" en Cursor
   - Abre Cursor
   - Ve a Extensiones (Ctrl+Shift+X)
   - Busca "MySQL" y instala

2. Configura la conexión:
   - Presiona `Ctrl+Shift+P` (o `Cmd+Shift+P` en Mac)
   - Escribe "MySQL: Add Connection"
   - Ingresa los datos:
     ```
     Host: (tu host de Hostinger, ej: localhost o IP)
     Port: 3306 (puerto por defecto de MySQL)
     User: (tu usuario MySQL)
     Password: (tu contraseña)
     Database: (nombre de tu base de datos)
     ```

3. Conecta:
   - Presiona `Ctrl+Shift+P`
   - Escribe "MySQL: Connect"
   - Selecciona tu conexión

## Opción 2: Usar DBeaver (Aplicación externa)

1. Descarga DBeaver: https://dbeaver.io/
2. Instala y abre DBeaver
3. Crea nueva conexión → MySQL
4. Ingresa credenciales de Hostinger
5. Puedes ejecutar queries y ver datos

## Opción 3: Conectar desde la App (Para desarrollo)

Podemos crear un servicio que se conecte directamente a MySQL de Hostinger desde la aplicación.

