# Plan VPS KVM 2 - Hostinger

## ¿Qué es un VPS KVM 2?

Un VPS (Virtual Private Server) KVM 2 es un servidor virtual con:
- **Control completo (root access)**: Puedes instalar cualquier software
- **Recursos dedicados**: CPU, RAM y almacenamiento garantizados
- **IP dedicada**: Tu propio servidor con IP única
- **Sistema operativo**: Generalmente Linux (Ubuntu/CentOS)

## Ventajas para Nuestra Aplicación

✅ **Perfecto para nuestra app** porque:
- Podemos instalar Node.js
- Podemos instalar MySQL o PostgreSQL
- Podemos configurar el backend API
- Control total del servidor
- Las 4 PCs se conectan al mismo servidor

## Arquitectura Propuesta

```
[PC 1] ──┐
[PC 2] ──┤
[PC 3] ──┼──> [Backend API en VPS] ──> [Base de Datos MySQL]
[PC 4] ──┘         (Node.js + Express)
```

## Lo que Necesitamos Instalar en el VPS

1. **Node.js** (versión 18 o superior)
2. **MySQL** o **PostgreSQL** (base de datos)
3. **PM2** (para mantener el servidor corriendo)
4. **Nginx** (opcional, para servir la app web si quieren)
5. **Backend API** (nuestro código)

## Información que Necesito

Para configurar todo, necesito:

1. **Acceso SSH:**
   - IP del servidor: _______________
   - Usuario: _______________ (generalmente `root`)
   - Contraseña o clave SSH: _______________

2. **Sistema Operativo:**
   - ¿Qué Linux tiene instalado? (Ubuntu, CentOS, etc.)
   - Versión: _______________

3. **Base de Datos:**
   - ¿Prefieren MySQL o PostgreSQL?
   - Credenciales de acceso (si ya está instalado)

4. **Dominio (opcional):**
   - ¿Tienen dominio configurado?
   - URL: _______________

## Plan de Implementación

### Fase 1: Preparación del Servidor
1. Conectarse por SSH
2. Instalar Node.js
3. Instalar MySQL/PostgreSQL
4. Configurar firewall

### Fase 2: Backend API
1. Crear servidor Express
2. Configurar conexión a base de datos
3. Crear endpoints REST
4. Subir código al servidor

### Fase 3: Base de Datos
1. Crear base de datos
2. Migrar esquema de SQLite a MySQL
3. Configurar usuarios y permisos

### Fase 4: Cliente (Electron)
1. Modificar Electron para usar API
2. Reemplazar SQLite por llamadas HTTP
3. Manejo de conexión/desconexión

### Fase 5: Despliegue
1. Instalar PM2 para mantener servidor activo
2. Configurar inicio automático
3. Probar desde las 4 PCs

## Estructura del Proyecto

```
aserradero/
├── client/              # Aplicación Electron (modificada)
│   ├── src/
│   └── ...
├── server/              # Backend API (NUEVO)
│   ├── src/
│   │   ├── routes/      # Endpoints API
│   │   ├── models/      # Modelos de base de datos
│   │   ├── controllers/ # Lógica de negocio
│   │   └── config/      # Configuración
│   ├── package.json
│   └── server.js
└── database/            # Scripts de migración
    └── migration.sql
```

## Próximos Pasos

1. **Obtener acceso SSH** al VPS
2. **Verificar sistema operativo** (`uname -a`)
3. **Instalar Node.js** si no está
4. **Instalar MySQL/PostgreSQL**
5. **Crear backend API**
6. **Migrar base de datos**
7. **Modificar Electron** para usar API

---

**¿Tienes acceso SSH al VPS? Si es así, podemos empezar a configurarlo.**

