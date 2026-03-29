# 🚀 Guía Completa: Conectarse a Hostinger desde Cursor

> **AVISO (2026):** partes de esta guía pueden contener pasos viejos; priorizá el esquema actual (**MySQL + Electron**).

## 📋 Índice

1. [¿Qué es Hostinger y qué puedo hacer?](#qué-es-hostinger-y-qué-puedo-hacer)
2. [Tipos de Hosting en Hostinger](#tipos-de-hosting-en-hostinger)
3. [¿Qué es la máquina Ubuntu que tienes?](#qué-es-la-máquina-ubuntu-que-tienes)
4. [Conectarse desde Cursor (SSH)](#conectarse-desde-cursor-ssh)
5. [Opciones Alternativas de Conexión](#opciones-alternativas-de-conexión)
6. [¿Qué puedes hacer con tu VPS Ubuntu?](#qué-puedes-hacer-con-tu-vps-ubuntu)
7. [Próximos Pasos](#próximos-pasos)

---

## ¿Qué es Hostinger y qué puedo hacer?

**Hostinger** es un proveedor de hosting que ofrece varios servicios:

### 🎯 Servicios Principales

1. **Hosting Compartido**
   - Para sitios web simples
   - Comparte recursos con otros usuarios
   - Panel de control fácil (hPanel)
   - **Limitaciones**: No puedes instalar software personalizado fácilmente

2. **VPS (Virtual Private Server)** ⭐ **ESTO ES LO QUE TIENES**
   - Servidor virtual privado
   - **Tienes control completo** como si fuera tu propia computadora
   - Puedes instalar lo que quieras
   - Sistema operativo Ubuntu (Linux)
   - **Perfecto para**: Bases de datos, APIs, aplicaciones web complejas

3. **Cloud Hosting**
   - Similar a VPS pero más escalable
   - Recursos que se ajustan automáticamente

### 💡 Para tu Aplicación del Aserradero

Con tu VPS puedes:
- ✅ Instalar PostgreSQL o MySQL (base de datos)
- ✅ Instalar Node.js (para API backend)
- ✅ Almacenar backups automáticos
- ✅ Crear un API REST para conectar la app
- ✅ Servir la aplicación web (si quieres convertirla)
- ✅ Almacenar imágenes de remitos

---

## Tipos de Hosting en Hostinger

### 🆚 Comparación Rápida

| Característica | Hosting Compartido | VPS (Tienes esto) |
|----------------|-------------------|-------------------|
| Control del sistema | ❌ Limitado | ✅ Completo |
| Instalar software | ❌ Solo panel | ✅ Lo que quieras |
| Base de datos | ✅ Sí (limitada) | ✅ Sí (ilimitada) |
| Acceso SSH | ⚠️ A veces | ✅ Siempre |
| Precio | 💰 Bajo | 💰 Medio |
| Para tu app | ⚠️ Difícil | ✅ Perfecto |

---

## ¿Qué es la máquina Ubuntu que tienes?

### 🐧 Ubuntu explicado simple

**Ubuntu** es un sistema operativo Linux (similar a Windows, pero diferente). Tu VPS tiene:

1. **Sistema Operativo Ubuntu**
   - Interfaz por línea de comandos (terminal)
   - Puedes instalar programas con comandos
   - Muy estable y seguro

2. **Acceso por SSH**
   - Te conectas desde tu PC Windows
   - Ves una "ventana negra" (terminal)
   - Escribes comandos como un programador

3. **Recursos dedicados**
   - RAM, CPU y disco solo para ti
   - No compartes con nadie

### 🎯 En resumen

Tu VPS Ubuntu es como una **computadora remota en internet** que:
- Está encendida 24/7
- Tiene dirección IP pública (se puede acceder desde cualquier lado)
- Tú controlas todo
- Es donde pondrás tu base de datos y backups

---

## Conectarse desde Cursor (SSH)

### 🛠️ Método 1: Terminal Integrado de Cursor (Recomendado)

Cursor tiene terminal integrado. Aquí cómo usarlo:

#### Paso 1: Abrir Terminal en Cursor

1. **Presiona** `Ctrl + Ñ` (o `Ctrl + J`) para abrir el panel inferior
2. O ve a **Terminal → New Terminal** en el menú
3. Se abrirá una terminal en la parte inferior

#### Paso 2: Conectarte por SSH

```bash
ssh root@TU_IP_DEL_VPS
```

**Ejemplo:**
```bash
ssh root@185.123.45.67
```

**Primera vez:**
- Te preguntará si confías en el servidor
- Escribe `yes` y presiona Enter
- Te pedirá la contraseña (no se verá mientras escribes, es normal)

#### Paso 3: ¡Estás conectado!

Verás algo como:
```
root@vps12345:~#
```

¡Ya estás en tu servidor Ubuntu!

### 🛠️ Método 2: Extensión SSH en Cursor

#### Paso 1: Instalar Extensión

1. Presiona `Ctrl + Shift + X` para abrir extensiones
2. Busca **"Remote - SSH"** (de Microsoft)
3. Instálala

#### Paso 2: Configurar Conexión

1. Presiona `Ctrl + Shift + P`
2. Escribe: `Remote-SSH: Connect to Host`
3. Selecciona **"Configure SSH Hosts..."**
4. Elige el archivo de configuración (el primero está bien)

#### Paso 3: Agregar tu VPS

Se abrirá un archivo. Agrega esto al final:

```ssh-config
Host aserradero-vps
    HostName TU_IP_DEL_VPS
    User root
    Port 22
```

**Ejemplo:**
```ssh-config
Host aserradero-vps
    HostName 185.123.45.67
    User root
    Port 22
```

Guarda el archivo (`Ctrl + S`)

#### Paso 4: Conectarte

1. Presiona `Ctrl + Shift + P`
2. Escribe: `Remote-SSH: Connect to Host`
3. Selecciona **"aserradero-vps"**
4. Ingresa tu contraseña

**¡Ahora puedes editar archivos directamente en el servidor desde Cursor!**

### 🔐 Método 3: Usar Clave SSH (Más Seguro)

En lugar de contraseña, puedes usar una clave SSH:

#### Paso 1: Generar Clave en tu PC (si no tienes)

```bash
ssh-keygen -t rsa -b 4096
```

- Presiona Enter para la ubicación por defecto
- Presiona Enter para sin contraseña (o pon una si quieres)
- Se crearán dos archivos:
  - `C:\Users\ozozo\.ssh\id_rsa` (privada, NO compartir)
  - `C:\Users\ozozo\.ssh\id_rsa.pub` (pública, esta la compartes)

#### Paso 2: Copiar Clave al Servidor

```bash
ssh-copy-id root@TU_IP_DEL_VPS
```

O manualmente:
```bash
# En tu PC, ver la clave pública
type C:\Users\ozozo\.ssh\id_rsa.pub

# Copiar el contenido, luego en el servidor:
ssh root@TU_IP_DEL_VPS
mkdir -p ~/.ssh
echo "TU_CLAVE_PUBLICA_AQUI" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

#### Paso 3: Conectar sin Contraseña

```bash
ssh root@TU_IP_DEL_VPS
```

¡Ya no te pedirá contraseña!

---

## Opciones Alternativas de Conexión

### 📦 WinSCP (Interfaz Gráfica para Archivos)

**Para subir/bajar archivos fácilmente:**

1. Descarga: https://winscp.net/
2. Instálalo
3. Conéctate con:
   - **Host**: Tu IP del VPS
   - **Usuario**: root
   - **Contraseña**: Tu contraseña
4. **Arrastra y suelta** archivos entre tu PC y el servidor

### 🖥️ PuTTY (Terminal Alternativa)

**Si prefieres otra terminal:**

1. Descarga: https://www.putty.org/
2. Instálalo
3. Conéctate con:
   - **Host Name**: Tu IP del VPS
   - **Port**: 22
   - **Connection Type**: SSH
4. Click "Open"

---

## ¿Qué puedes hacer con tu VPS Ubuntu?

### 🗄️ 1. Base de datos en el VPS (MySQL)

**¿Por qué MySQL aquí?**
- Es el motor usado por la app en producción (Hostinger MySQL)
- Evitás mezclar motores (Postgres vs MySQL) sin necesidad

**Comandos (ejemplo):**
```bash
apt update
apt install mysql-server -y
mysql_secure_installation

mysql -u root -p
CREATE DATABASE aserradero_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'aserradero_user'@'%' IDENTIFIED BY 'tu_password_seguro';
GRANT ALL PRIVILEGES ON aserradero_db.* TO 'aserradero_user'@'%';
FLUSH PRIVILEGES;
EXIT;
```

> Nota: abrir MySQL a la red pública es sensible. Preferí VPN/SSH tunnel/firewall allowlist.

### 📁 4. Crear Sistema de Backups

**Script para backup automático:**
```bash
# Crear directorio de backups
mkdir -p /var/backups/aserradero
cd /var/backups/aserradero

# Script de backup (lo creamos después)
nano backup-daily.sh
```

### 🌐 5. Configurar Firewall

**Proteger el servidor:**
```bash
# Instalar firewall
apt install ufw -y

# Permitir SSH (IMPORTANTE: hacer primero)
ufw allow 22/tcp

# Habilitar firewall
ufw enable

# Ver estado
ufw status
```

### 📦 6. Instalar Git

**Para clonar repositorios:**
```bash
apt install git -y
```

### 🔍 7. Instalar Herramientas Útiles

```bash
# Editor de texto (nano es fácil)
apt install nano -y

# Ver procesos
apt install htop -y

# Compresor
apt install zip unzip -y
```

---

## Próximos Pasos

### 🎯 Plan operativo en Hostinger (estado deseado)

1. **Fase 1: MySQL**
   - [ ] Conectarte por SSH
   - [ ] MySQL instalado y accesible (usuarios, permisos, firewall)
   - [ ] Base creada (`aserradero_db` o la que corresponda)
   - [ ] Backups programados (`mysqldump` + retención)

2. **Fase 2: App Electron**
   - [ ] La app apunta al MySQL correcto (config en `database/mysqlService.js` en el build)
   - [ ] Probar login + CRUD básico

3. **Fase 3: Imágenes**
   - [ ] Validar tamaño de backups SQL si hay muchas fotos en data URL
   - [ ] (Opcional) política de compresión / límites si el SQL crece demasiado

### 📝 Información que Necesito de Ti

Para continuar, necesito:

1. **IP del VPS**: `XXX.XXX.XXX.XXX`
2. **Usuario SSH**: Generalmente `root`
3. **Contraseña SSH**: (o prefieres usar clave?)
4. **¿Qué base de datos prefieres?**: PostgreSQL o MySQL
5. **¿Tienes dominio?**: (ej: `aserradero.tudominio.com`)

---

## 🆘 Comandos Útiles para Empezar

### Ver información del sistema
```bash
# Ver espacio en disco
df -h

# Ver memoria
free -h

# Ver información del sistema
uname -a

# Ver IP del servidor
ip addr show
```

### Navegar archivos
```bash
# Ver donde estás
pwd

# Listar archivos
ls -la

# Cambiar de directorio
cd /var/www

# Subir un nivel
cd ..

# Ir al home
cd ~
```

### Editar archivos
```bash
# Abrir con nano (fácil)
nano archivo.txt

# Guardar: Ctrl + O
# Salir: Ctrl + X
```

### Ver logs
```bash
# Ver logs del sistema
journalctl -xe

# Ver logs en tiempo real
tail -f /var/log/syslog
```

---

## 📚 Recursos Adicionales

- **Documentación Ubuntu**: https://ubuntu.com/tutorials
- **Documentación PostgreSQL**: https://www.postgresql.org/docs/
- **Documentación Node.js**: https://nodejs.org/docs/
- **Guía SSH**: https://www.ssh.com/academy/ssh

---

## 💬 ¿Dudas?

Si tienes alguna pregunta o necesitas ayuda con algún paso, avísame y te guío paso a paso.

**¿Listo para empezar? Primero necesito tu IP del VPS para conectarnos!** 🚀



