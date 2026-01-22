# Configuración Paso a Paso del VPS KVM 2 - Hostinger

## 📋 Índice
1. [Acceso Inicial al VPS](#1-acceso-inicial-al-vps)
2. [Actualizar el Sistema](#2-actualizar-el-sistema)
3. [Instalar Node.js](#3-instalar-nodejs)
4. [Instalar MySQL](#4-instalar-mysql)
5. [Configurar MySQL](#5-configurar-mysql)
6. [Crear Base de Datos](#6-crear-base-de-datos)
7. [Subir Código del Backend](#7-subir-código-del-backend)
8. [Configurar Backend](#8-configurar-backend)
9. [Instalar PM2](#9-instalar-pm2)
10. [Iniciar la Aplicación](#10-iniciar-la-aplicación)
11. [Configurar Firewall](#11-configurar-firewall)
12. [Verificar que Funciona](#12-verificar-que-funciona)

---

## 1. Acceso Inicial al VPS

### Paso 1.1: Obtener Credenciales
1. Ve al panel de control de Hostinger
2. Busca tu VPS KVM 2
3. Anota:
   - **IP del servidor**: `XXX.XXX.XXX.XXX`
   - **Usuario**: Generalmente `root`
   - **Contraseña**: La que configuraste

### Paso 1.2: Conectarse por SSH

**En Windows (PowerShell o CMD):**
```bash
ssh root@TU_IP_AQUI
```

**Ejemplo:**
```bash
ssh root@185.123.45.67
```

**Si te pide contraseña, escríbela (no se verá mientras escribes, es normal)**

**Si es la primera vez, te preguntará si confías en el servidor, escribe `yes`**

---

## 2. Actualizar el Sistema

Una vez conectado, ejecuta estos comandos uno por uno:

```bash
# Actualizar lista de paquetes
apt update

# Actualizar sistema
apt upgrade -y
```

**Esto puede tardar unos minutos. Espera a que termine.**

---

## 3. Instalar Node.js

### Paso 3.1: Instalar Node.js 18.x

```bash
# Descargar e instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -

# Instalar Node.js
apt-get install -y nodejs
```

### Paso 3.2: Verificar Instalación

```bash
# Ver versión de Node.js (debe mostrar v18.x.x o superior)
node --version

# Ver versión de npm (debe mostrar 9.x.x o superior)
npm --version
```

**Si ves las versiones, ¡perfecto! Si no, avísame y lo revisamos.**

---

## 4. Instalar MySQL

```bash
# Instalar MySQL Server
apt install mysql-server -y
```

**Espera a que termine la instalación.**

---

## 5. Configurar MySQL

### Paso 5.1: Configurar Seguridad

```bash
# Ejecutar configuración de seguridad
mysql_secure_installation
```

**Te hará varias preguntas. Responde así:**
- **Validación de contraseña**: Presiona `N` (No)
- **Nueva contraseña root**: Escribe una contraseña SEGURA y anótala
- **Confirmar contraseña**: Escribe la misma contraseña
- **Eliminar usuarios anónimos**: `Y` (Yes)
- **Deshabilitar login remoto root**: `Y` (Yes)
- **Eliminar base de datos test**: `Y` (Yes)
- **Recargar privilegios**: `Y` (Yes)

### Paso 5.2: Verificar que MySQL Funciona

```bash
# Conectarse a MySQL
mysql -u root -p
```

**Te pedirá la contraseña que acabas de crear. Escríbela.**

**Si ves `mysql>`, ¡funciona! Escribe `exit;` para salir.**

---

## 6. Crear Base de Datos

### Paso 6.1: Conectarse a MySQL

```bash
mysql -u root -p
```

**Escribe tu contraseña de MySQL.**

### Paso 6.2: Crear Base de Datos y Usuario

**Copia y pega estos comandos uno por uno en MySQL:**

```sql
-- Crear base de datos
CREATE DATABASE aserradero_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario (cambia 'tu_password_seguro' por una contraseña)
CREATE USER 'aserradero_user'@'localhost' IDENTIFIED BY 'tu_password_seguro';

-- Dar permisos al usuario
GRANT ALL PRIVILEGES ON aserradero_db.* TO 'aserradero_user'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Verificar que se creó
SHOW DATABASES;

-- Salir de MySQL
EXIT;
```

**IMPORTANTE: Anota la contraseña que pusiste para `aserradero_user`**

---

## 7. Subir Código del Backend

### Opción A: Usando SCP (desde tu PC Windows)

**Abre PowerShell en tu PC (donde está el proyecto):**

```powershell
# Navegar a la carpeta del proyecto
cd C:\Users\ozozo\Documents\aserradero

# Subir carpeta server al VPS
scp -r server root@TU_IP:/var/www/aserradero-api/
```

**Reemplaza `TU_IP` con la IP de tu VPS**

**Te pedirá la contraseña del VPS**

### Opción B: Usando WinSCP (Interfaz Gráfica)

1. Descarga WinSCP: https://winscp.net/
2. Instálalo
3. Conéctate con:
   - **Host**: Tu IP del VPS
   - **Usuario**: root
   - **Contraseña**: Tu contraseña del VPS
4. Arrastra la carpeta `server` a `/var/www/aserradero-api/`

### Opción C: Crear Archivos Directamente en el VPS

Si prefieres, puedo darte los comandos para crear los archivos directamente en el servidor.

---

## 8. Configurar Backend

### Paso 8.1: Crear Directorio y Navegar

```bash
# Crear directorio
mkdir -p /var/www/aserradero-api
cd /var/www/aserradero-api
```

### Paso 8.2: Si subiste con SCP, mover archivos

```bash
# Si subiste la carpeta server, mover contenido
mv server/* .
mv server/.* . 2>/dev/null || true
rmdir server
```

### Paso 8.3: Instalar Dependencias

```bash
cd /var/www/aserradero-api
npm install --production
```

**Esto puede tardar 1-2 minutos. Espera.**

### Paso 8.4: Crear Archivo de Configuración

```bash
# Crear archivo .env
nano .env
```

**Pega este contenido (ajusta los valores):**

```env
PORT=3001
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_USER=aserradero_user
DB_PASSWORD=tu_password_seguro
DB_NAME=aserradero_db
UPLOAD_DIR=./uploads/fotos_remitos
MAX_FILE_SIZE=10485760
```

**IMPORTANTE:**
- Cambia `tu_password_seguro` por la contraseña que creaste para `aserradero_user`

**Para guardar en nano:**
- Presiona `Ctrl + O` (guardar)
- Presiona `Enter` (confirmar)
- Presiona `Ctrl + X` (salir)

### Paso 8.5: Crear Directorio para Fotos

```bash
mkdir -p uploads/fotos_remitos
```

---

## 9. Instalar PM2

**PM2 mantiene el servidor corriendo siempre:**

```bash
# Instalar PM2 globalmente
npm install -g pm2
```

---

## 10. Iniciar la Aplicación

### Paso 10.1: Crear las Tablas en MySQL

**Primero, necesitamos crear el archivo SQL. Ejecuta:**

```bash
# Crear el archivo SQL
nano /var/www/aserradero-api/scripts/create_database.sql
```

**Pega el contenido del archivo `server/scripts/create_database.sql` que creamos**

**O ejecuta directamente:**

```bash
# Importar esquema de base de datos
mysql -u aserradero_user -p aserradero_db < /var/www/aserradero-api/scripts/create_database.sql
```

**Te pedirá la contraseña de `aserradero_user`**

### Paso 10.2: Iniciar con PM2

```bash
cd /var/www/aserradero-api
pm2 start server.js --name aserradero-api
```

### Paso 10.3: Configurar Inicio Automático

```bash
# Generar script de inicio
pm2 startup

# Guardar configuración actual
pm2 save
```

**El comando `pm2 startup` te dará un comando para copiar y pegar. Cópialo y ejecútalo.**

---

## 11. Configurar Firewall

```bash
# Permitir puerto 3001
ufw allow 3001/tcp

# Habilitar firewall
ufw enable

# Verificar reglas
ufw status
```

---

## 12. Verificar que Funciona

### Paso 12.1: Ver Estado de la Aplicación

```bash
# Ver estado
pm2 status

# Ver logs
pm2 logs aserradero-api
```

**Deberías ver:**
```
🚀 Servidor API corriendo en puerto 3001
✅ Conectado a MySQL
```

### Paso 12.2: Probar API

```bash
# Probar desde el servidor
curl http://localhost:3001/api/health
```

**Deberías ver:**
```json
{"status":"ok","message":"API funcionando correctamente","timestamp":"..."}
```

### Paso 12.3: Probar desde tu PC

**Abre un navegador en tu PC y ve a:**
```
http://TU_IP:3001/api/health
```

**Reemplaza `TU_IP` con la IP de tu VPS**

**Si ves el JSON, ¡funciona!**

---

## ✅ Comandos Útiles

```bash
# Ver estado de la aplicación
pm2 status

# Ver logs en tiempo real
pm2 logs aserradero-api

# Reiniciar aplicación
pm2 restart aserradero-api

# Detener aplicación
pm2 stop aserradero-api

# Ver uso de recursos
pm2 monit
```

---

## 🆘 Si Algo Sale Mal

### Error: "Cannot connect to MySQL"
- Verifica que MySQL esté corriendo: `systemctl status mysql`
- Verifica credenciales en `.env`
- Verifica que el usuario tenga permisos

### Error: "Port 3001 already in use"
- Cambia el puerto en `.env` a otro (ej: 3002)
- Reinicia: `pm2 restart aserradero-api`

### Error: "Cannot find module"
- Ejecuta: `cd /var/www/aserradero-api && npm install`

### Ver Logs de Errores
```bash
pm2 logs aserradero-api --err
```

---

## 📝 Checklist Final

- [ ] Node.js instalado y funcionando
- [ ] MySQL instalado y configurado
- [ ] Base de datos creada
- [ ] Código subido al servidor
- [ ] Archivo `.env` configurado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Tablas creadas en MySQL
- [ ] PM2 instalado
- [ ] Aplicación corriendo (`pm2 status`)
- [ ] API responde (`curl http://localhost:3001/api/health`)
- [ ] Firewall configurado
- [ ] Accesible desde fuera (`http://TU_IP:3001/api/health`)

---

**¿En qué paso estás? Avísame si necesitas ayuda en algún paso específico.**

