# 🔐 Sistema de Auditorías - Aserradero App v3

## ✅ Implementación Completada

### 📱 Componentes Añadidos
- **Login.js** - Pantalla de inicio de sesión con validación
- **AdminPanel.js** - Panel de administración (solo para admins)
- **HistorialAuditoria.js** - Modal de historial por módulo
- **CambiarPassword.js** - Modal para cambiar contraseña

### 🛠️ Servicios Integrados
- **databaseService.js** - Funciones de usuarios y auditoría
- **hostingerService.js** - Conectores MySQL para login y auditorías
- **formatoAuditoria.js** - Utilidades de formateo

### 🔄 Sistema de Autenticación
- Login obligatorio antes de usar la app
- Sesión guardada en localStorage
- Logout desde el header
- Cambio de contraseña desde el header

### 👥 Gestión de Usuarios (Solo Admin)
- Crear usuarios nuevos
- Activar/desactivar usuarios
- Ver último login
- Gestión de roles (admin/usuario)

### 📋 Sistema de Auditorías
- Historial por módulo (botón en cada pestaña)
- Filtros por fecha, usuario y búsqueda
- Comparación antes/después de cambios
- Registro automático de todas las operaciones

## 🗄️ Base de Datos

### Tablas Requeridas
1. **usuarios** - Gestión de usuarios y roles
2. **auditoria** - Registro de todas las operaciones

### Script SQL
Ver: `database/v1.2_usuarios_auditoria.sql`

## 🚀 Para Usar

1. **Instalar dependencias** (si es necesario):
```bash
npm install bcrypt
```

2. **Ejecutar script SQL** en Hostinger:
- Conectar a phpMyAdmin
- Ejecutar `database/v1.2_usuarios_auditoria.sql`

3. **Crear usuario admin**:
```sql
INSERT INTO usuarios (username, password_hash, nombre_completo, rol) 
VALUES ('admin', 'admin123', 'Administrador', 'admin');
```

4. **Iniciar la app**:
```bash
npm run dev
```

## 🔑 Usuarios Predeterminados

- **Usuario**: `admin`
- **Contraseña**: `admin123`
- **Rol**: Administrador

## 📊 Funcionalidades Principales

### Para Admin:
- ⚙️ Gestionar usuarios (crear, activar/desactivar)
- 📋 Ver auditorías de todos los módulos
- 🐛 Ver y resolver errores reportados
- 🔑 Cambiar su contraseña

### Para Usuario Normal:
- 📋 Ver historial de sus propios cambios
- 🔑 Cambiar su contraseña
- 🐛 Reportar errores

### Para Todos:
- Todas las operaciones se registran automáticamente
- Historial detallado en cada módulo
- Sistema seguro con login obligatorio

## ⚡ Características Técnicas

- **Autenticación**: Simple por usuario/contraseña
- **Persistencia**: localStorage para mantener sesión
- **Seguridad**: Roles y permisos diferenciados
- **Performance**: Filtros optimizados en auditorías
- **UX**: Interfaz integrada sin afectar flujo de trabajo

La app está lista para producción con sistema completo de auditorías y control de usuarios.
