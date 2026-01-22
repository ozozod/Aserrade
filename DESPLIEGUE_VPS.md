# Guía de Despliegue en VPS KVM 2 - Hostinger

## Requisitos Previos

- Acceso SSH al VPS
- Usuario con permisos root o sudo
- Conocimiento básico de Linux (o seguir esta guía paso a paso)

## Paso 1: Conectarse al VPS

```bash
ssh root@TU_IP_DEL_VPS
# O si usas usuario específico:
ssh usuario@TU_IP_DEL_VPS
```

## Paso 2: Actualizar el Sistema

```bash
# Para Ubuntu/Debian:
sudo apt update && sudo apt upgrade -y

# Para CentOS/RHEL:
sudo yum update -y
```

## Paso 3: Instalar Node.js

```bash
# Opción 1: Usando NodeSource (recomendado)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version
npm --version
```

## Paso 4: Instalar MySQL

```bash
# Instalar MySQL
sudo apt install mysql-server -y

# Configurar MySQL (seguir el asistente)
sudo mysql_secure_installation

# Crear base de datos y usuario
sudo mysql -u root -p
```

Dentro de MySQL:
```sql
CREATE DATABASE aserradero_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'aserradero_user'@'localhost' IDENTIFIED BY 'tu_password_seguro';
GRANT ALL PRIVILEGES ON aserradero_db.* TO 'aserradero_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Paso 5: Subir Código del Backend

```bash
# Crear directorio para la aplicación
mkdir -p /var/www/aserradero-api
cd /var/www/aserradero-api

# Subir archivos (usando SCP desde tu PC local)
# Desde tu PC Windows:
# scp -r server/* root@TU_IP:/var/www/aserradero-api/
```

O clonar desde Git si tienes repositorio:
```bash
git clone TU_REPOSITORIO /var/www/aserradero-api
cd /var/www/aserradero-api/server
```

## Paso 6: Instalar Dependencias

```bash
cd /var/www/aserradero-api/server
npm install --production
```

## Paso 7: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar configuración
nano .env
```

Configurar:
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

## Paso 8: Crear Base de Datos

```bash
# Importar esquema
mysql -u aserradero_user -p aserradero_db < scripts/create_database.sql
```

## Paso 9: Instalar PM2 (Gestor de Procesos)

```bash
npm install -g pm2

# Iniciar aplicación
cd /var/www/aserradero-api/server
pm2 start server.js --name aserradero-api

# Configurar inicio automático
pm2 startup
pm2 save
```

## Paso 10: Configurar Firewall

```bash
# Permitir puerto 3001 (o el que uses)
sudo ufw allow 3001/tcp
sudo ufw enable
```

## Paso 11: Configurar Nginx (Opcional - para servir la app web)

```bash
sudo apt install nginx -y

# Crear configuración
sudo nano /etc/nginx/sites-available/aserradero
```

Configuración Nginx:
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    # API Backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Archivos estáticos (fotos)
    location /uploads {
        alias /var/www/aserradero-api/server/uploads;
    }

    # Frontend (si compilas React)
    location / {
        root /var/www/aserradero-api/client/build;
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Activar sitio
sudo ln -s /etc/nginx/sites-available/aserradero /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Verificación

```bash
# Verificar que el servidor está corriendo
pm2 status

# Ver logs
pm2 logs aserradero-api

# Probar API
curl http://localhost:3001/api/health
```

## Comandos Útiles

```bash
# Reiniciar aplicación
pm2 restart aserradero-api

# Ver logs en tiempo real
pm2 logs aserradero-api

# Detener aplicación
pm2 stop aserradero-api

# Ver uso de recursos
pm2 monit
```

## Actualizar Código

```bash
cd /var/www/aserradero-api/server
git pull  # Si usas Git
# O subir nuevos archivos con SCP

npm install --production
pm2 restart aserradero-api
```

## Backup de Base de Datos

```bash
# Crear backup
mysqldump -u aserradero_user -p aserradero_db > backup_$(date +%Y%m%d).sql

# Restaurar backup
mysql -u aserradero_user -p aserradero_db < backup_20241119.sql
```

---

**Una vez completado, el API estará disponible en:**
- `http://TU_IP:3001/api/health`
- O si configuraste dominio: `http://tu-dominio.com/api/health`

