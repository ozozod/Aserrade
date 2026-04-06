# Hoja de Ruta - Aserradero App

## 📋 Estado del Proyecto

**Fecha de inicio**: Noviembre 2024 (desarrollo inicial)  
**Estado actual**: ✅ Versión inicial completada  
**Última actualización**: Abril 2026 — v2.1.1 (cuentas corrientes: saldo neto en UI y totales export)

---

## ✅ Tareas Completadas

### 1. Estructura del Proyecto ✅
- [x] Crear proyecto Electron + React
- [x] Configurar estructura de carpetas
- [x] Configurar package.json con dependencias
- [x] Crear archivos principales (main.js, preload.js)

### 2. Base de Datos ✅
- [x] Diseñar esquema de base de datos SQLite
- [x] Implementar tabla de clientes
- [x] Implementar tabla de remitos
- [x] Implementar tabla de pagos
- [x] Crear índices para optimización
- [x] Implementar lógica de actualización automática de estados

### 3. Interfaz de Usuario ✅
- [x] Crear componente Header
- [x] Crear sistema de navegación lateral
- [x] Crear componente de gestión de Clientes
  - [x] Formulario de creación/edición
  - [x] Lista de clientes
  - [x] Funciones de editar y eliminar
- [x] Crear componente de gestión de Remitos
  - [x] Formulario completo de remitos
  - [x] Cálculo automático de precios
  - [x] Gestión de estados de pago
  - [x] Lista de remitos con todos los datos
- [x] Crear componente de gestión de Pagos
  - [x] Formulario de registro de pagos
  - [x] Validación de montos
  - [x] Actualización automática de estados
  - [x] Lista de pagos registrados
- [x] Crear componente de Reportes
  - [x] Selección de cliente
  - [x] Vista de cuenta corriente
  - [x] Resumen de totales
  - [x] Lista completa de remitos del cliente
- [x] Crear componente de Resumen General
  - [x] Estadísticas generales
  - [x] Lista de últimos remitos
  - [x] Métricas de negocio

### 4. Funcionalidades de Exportación ✅
- [x] Implementar exportación a PDF
  - [x] Exportación de cuenta corriente
  - [x] Exportación de resumen general
  - [x] Formato profesional con tablas
- [x] Implementar exportación a Excel
  - [x] Exportación de cuenta corriente con múltiples hojas
  - [x] Exportación de resumen general
  - [x] Formato estructurado

### 5. Integración Electron ✅
- [x] Configurar comunicación entre proceso principal y renderer
- [x] Implementar IPC handlers para todas las operaciones
- [x] Configurar preload script para seguridad
- [x] Configurar ventana principal de Electron

### 6. Base de datos centralizada (MySQL Hostinger) ✅
- [x] MySQL remoto en Hostinger (usuarios, firewall, acceso)
- [x] Servicio Node/Electron `database/mysqlService.js` + IPC `mysql:*`
- [x] Frontend React consumiendo datos vía `hostingerService.js` / `databaseService.js`
- [x] Imágenes: compresión en Electron + persistencia en MySQL (data URL/base64)
- [x] Eliminación de cliente/dependencias legacy de base cloud en el runtime (solo MySQL)

### 7. Gestión de Artículos/Productos ✅
- [x] Crear componente Articulos
- [x] Implementar CRUD de artículos
- [x] Actualizar remitos para soportar múltiples artículos
- [x] Modificar esquema de base de datos (tabla remito_articulos)
- [x] Actualizar lógica de cálculo de precios

### 8. Mejoras de Funcionalidad ✅
- [x] Múltiples artículos por remito
- [x] Carga de fotos de remitos
- [x] Distribución automática de pagos por antigüedad
- [x] Soporte para saldo positivo (crédito) en clientes
- [x] Formato de moneda: 1.000.000,34
- [x] Mejoras en campos numéricos (no mostrar 0 inicial)

### 9. Exportación Mejorada ✅
- [x] Exportación a PDF con formato profesional
- [x] Exportación a Excel con formato estructurado
- [x] Soporte para múltiples artículos en reportes
- [x] Resumen general en PDF y Excel
- [x] Mejoras de diseño y layout

### 10. Instalador y Distribución ✅
- [x] Configurar electron-builder
- [x] Crear iconos personalizados (icon.ico, icon.png)
- [x] Configurar instalador NSIS para Windows
- [x] Generar instalador ejecutable (.exe)
- [x] Documentar proceso de generación del instalador

### 11. Documentación ✅
- [x] Crear README.md con descripción del proyecto
- [x] Crear GUIA_USUARIO.md para usuarios finales
- [x] Crear ELECTRON_BUILDER.md con instrucciones de empaquetado
- [x] Crear HOJA_DE_RUTA.md (este archivo)
- [x] Crear/actualizar documentación de Hostinger/MySQL (carpeta `hostinger/`)
- [x] Crear guías de instalación y uso
- [x] Crear documentación de seguridad
- [x] Crear guía de comercialización
- [x] Crear .gitignore
- [x] Documentar guía completa de actualizaciones automáticas (`docs/GUIA_ACTUALIZACIONES.md`)

### 12. Actualizaciones Automáticas ✅
- [x] Integrar `electron-updater` con proveedor GitHub
- [x] Configurar feed explícito (owner/repo) para evitar errores por metadata
- [x] Habilitar detección de releases marcados como *Pre-release* (`allowPrerelease`)
- [x] Logging de diagnóstico con `electron-log`
- [x] Flujo automático: detectar → descargar → reiniciar e instalar

### 13. Backups Ampliados ✅
- [x] Actualizar backup “desde PC” para incluir `saldos_iniciales`, `usuarios` y `auditoria`
- [x] Backup SQL desde la app (`exportBackupSQL`) incluyendo tablas nuevas (p.ej. `error_reports`)
- [x] Unificar la UX de la pantalla de Backups para reflejar el alcance real

### 14. PDF/Excel cuenta corriente — saldo inicial ✅
- [x] Columna DEBE: si el saldo inicial es **deuda** (`monto` negativo en BD), el saldo acumulado **arranca** en ese monto (alineado con el resumen); si es **crédito a favor** (`monto` positivo), sigue en 0 hasta aplicar saldo a favor (modo manual).


---

## 🎯 Funcionalidades Implementadas

### Gestión de Clientes
- ✅ Crear nuevos clientes
- ✅ Editar clientes existentes
- ✅ Eliminar clientes
- ✅ Ver lista completa de clientes
- ✅ Búsqueda por nombre (en selección)

### Gestión de Remitos
- ✅ Crear nuevos remitos
- ✅ Editar remitos existentes
- ✅ Eliminar remitos
- ✅ Cálculo automático de precio total
- ✅ Gestión de estados de pago:
  - Pendiente
  - Pago Parcial
  - Pagado
- ✅ Registro de monto pagado
- ✅ Número de remito opcional
- ✅ Artículos predefinidos (tipos de cajones)
- ✅ Observaciones por remito

### Gestión de Pagos
- ✅ Registrar pagos por remito
- ✅ Validación de montos (no exceder saldo pendiente)
- ✅ Actualización automática de estado del remito
- ✅ Registro de fecha y observaciones del pago
- ✅ Lista completa de pagos registrados

### Reportes
- ✅ Vista de cuenta corriente por cliente
- ✅ Resumen de totales (remitos, pagado, pendiente)
- ✅ Lista completa de remitos del cliente
- ✅ Exportación a PDF
- ✅ Exportación a Excel

### Resumen General
- ✅ Total de clientes
- ✅ Total de remitos
- ✅ Total facturado
- ✅ Total pagado
- ✅ Total pendiente
- ✅ Lista de últimos remitos
- ✅ Exportación a PDF y Excel

---

## 🚀 Características Técnicas

- **Plataforma**: Electron (Multiplataforma, enfocado en Windows)
- **Frontend**: React 18
- **Base de Datos**: SQLite (better-sqlite3)
- **Exportación PDF**: jsPDF + jspdf-autotable
- **Exportación Excel**: xlsx
- **Estilo**: CSS puro con diseño moderno
- **Arquitectura**: Separación de procesos (main/renderer)
- **Seguridad**: Context isolation y preload script

---

## 📦 Próximos Pasos Sugeridos (Futuro)

### Mejoras de Funcionalidad
- [ ] Filtros avanzados en listas (por fecha, cliente, estado)
- [ ] Búsqueda de remitos y clientes
- [ ] Imprimir remitos directamente
- [ ] Plantillas personalizables de remitos
- [ ] Múltiples usuarios con permisos
- [ ] Historial de cambios/auditoría
- [ ] Notificaciones de remitos pendientes
- [ ] Recordatorios de pagos

### Mejoras Técnicas
- [ ] Sincronización entre múltiples PCs (red local)
- [ ] Respaldo automático de base de datos
- [ ] Importación desde Excel
- [ ] Actualizaciones automáticas
- [ ] Mejoras en rendimiento (paginación, virtualización)
- [ ] Temas personalizables
- [ ] Soporte multiidioma

### Integraciones
- [ ] Exportación a sistemas contables
- [ ] Integración con impresoras de códigos de barras
- [ ] Conexión con sistemas ERP
- [ ] API REST para integraciones

---

## 📝 Notas de Desarrollo

### Decisiones Técnicas
- **SQLite local**: Elegido para funcionar offline sin necesidad de servidor
- **Electron**: Permite crear app de escritorio fácil de instalar y usar
- **React**: Facilita el desarrollo de interfaz moderna y responsive
- **CSS puro**: Sin frameworks pesados para mantener la app ligera

### Limitaciones Conocidas
- Por ahora funciona solo en una PC (base de datos local)
- Si se necesita usar en múltiples PCs, requerirá sincronización (a implementar)
- No hay sistema de usuarios múltiples (pendiente para futuras versiones)

### Archivos Importantes
- `main.js`: Proceso principal de Electron
- `preload.js`: Script de preload para seguridad
- `database/mysqlService.js`: Lógica de base de datos MySQL (Hostinger)
- `src/App.js`: Componente principal de React
- `src/components/`: Componentes de la interfaz

---

## 🎉 Versión 1.0.0 - Completada

**Fecha de creación v1.0**: Noviembre 2024  
**Actualización**: Noviembre 2025

**Estado**: ✅ LISTA PARA DISTRIBUCIÓN

**Funcionalidades Principales**:
- ✅ Gestión completa de clientes
- ✅ Gestión completa de remitos (múltiples artículos)
- ✅ Gestión de artículos/productos
- ✅ Registro de pagos (distribución automática)
- ✅ Soporte para saldo positivo (crédito)
- ✅ Cuentas corrientes
- ✅ Exportación a PDF y Excel (formato profesional)
- ✅ Resumen general
- ✅ Carga de fotos de remitos
- ✅ Base de datos centralizada en MySQL Hostinger (múltiples PCs)
- ✅ Instalador Windows (.exe) generado

**Instalador Generado**: ✅
- Archivo: `dist/Aserradero App-1.0.0-Setup.exe`
- Tipo: Instalador NSIS para Windows x64
- Icono personalizado incluido
- Listo para distribución

**Próximos pasos**: 
- ✅ Probar instalador en PC limpia
- ✅ Distribuir a clientes
- ✅ Monitorear uso y recopilar feedback

---

## 📞 Mantenimiento

**Desarrollador**: [Tu nombre]  
**Contacto**: [Tu contacto]

**Tareas de Mantenimiento**:
- Corrección de errores reportados
- Actualizaciones de seguridad
- Mejoras solicitadas por el cliente
- Soporte técnico

---

## 🔮 Funcionalidades Futuras (Pendientes de Implementación)

### Sistema de Usuarios y Autenticación ⏳
**Prioridad**: Alta  
**Motivo**: Saber quién hizo cada cambio para prevenir fugas de dinero  
**Estado**: Anotado para implementación futura

**Especificaciones:**
- **Usuarios**: Máximo 5 usuarios fijos (4 vendedores + 1 dueño)
- **Base de datos**: MySQL Hostinger (ya implementado)
- **Enfoque**: Identificación de usuarios para auditoría (no registro abierto)
- **Permisos del dueño**: A consultar cuando se venda la app

**Funcionalidades a implementar:**
- [ ] Login con usuario y contraseña (5 usuarios fijos)
- [ ] Roles básicos:
  - [ ] Vendedor: Crear/editar remitos, registrar pagos, ver reportes
  - [ ] Dueño/Administrador: Permisos especiales (a definir)
- [ ] Gestión de usuarios desde la app (solo el dueño puede crear/editar)
- [ ] Cambio de contraseña
- [ ] Desactivación de usuarios
- [ ] **Propósito principal**: Identificar quién hace cada operación (auditoría)

### Sistema de Auditoría Completo ⏳
**Prioridad**: Alta  
**Motivo**: Prevenir fugas de dinero - Registrar quién hizo qué cambios  
**Estado**: Anotado para implementación futura

**Funcionalidades a implementar:**
- [ ] Historial de todas las modificaciones en remitos
  - [ ] Registro de quién modificó (usuario)
  - [ ] Registro de cuándo modificó (fecha y hora)
  - [ ] Registro de valores anteriores y nuevos (antes/después)
  - [ ] Tipo de cambio (creación, edición, eliminación)
- [ ] Historial de cambios en artículos/productos
  - [ ] Registro de cambios en precios
  - [ ] Registro de activación/desactivación
  - [ ] Registro de modificaciones de nombre/descripción
- [ ] Historial de cambios en clientes
  - [ ] Registro de modificaciones de datos
  - [ ] Registro de eliminaciones
- [ ] Historial de pagos registrados
  - [ ] Registro de quién registró cada pago
  - [ ] Registro de modificaciones o cancelaciones
- [ ] Vista de historial en cada remito/artículo/cliente
  - [ ] Tabla de cambios con fecha, usuario y valores
  - [ ] Comparación antes/después
- [ ] Reportes de auditoría
  - [ ] Reporte general de todos los cambios
  - [ ] Reporte por usuario
  - [ ] Reporte por tipo de cambio
  - [ ] Reporte por fecha
  - [ ] Detección de anomalías (cambios grandes, muchos cambios en poco tiempo)
- [ ] Alertas de seguridad
  - [ ] Alertas por cambios grandes en montos
  - [ ] Alertas por muchas modificaciones en poco tiempo
  - [ ] Alertas por usuarios inactivos que hacen cambios
  - [ ] Alertas por eliminaciones

### Seguridad Adicional ⏳
**Prioridad**: Media-Alta  
**Motivo**: Mejorar protección de datos  
**Estado**: Anotado para implementación futura

**Funcionalidades a implementar:**
- [ ] Encriptación de datos sensibles
- [ ] Logs de acceso al sistema
- [ ] Alertas por actividades sospechosas
- [ ] Backup automático antes de cambios críticos
- [ ] Validación de permisos en cada operación
- [ ] Sesiones con timeout automático

### Costo Estimado de Implementación
- **Sistema de Usuarios**: ~$400 USD de desarrollo
- **Sistema de Auditoría**: ~$600 USD de desarrollo
- **Seguridad Adicional**: ~$200 USD de desarrollo
- **Testing y Documentación**: ~$200 USD
- **Total**: ~$1.400 USD de costo de desarrollo
- **Precio de venta v2.0**: $3.500 USD (vs $2.500 USD actual)

### Tiempo Estimado de Desarrollo
- **Fase 1 (Usuarios)**: 3-4 semanas
- **Fase 2 (Auditoría)**: 4-5 semanas
- **Fase 3 (Seguridad)**: 2-3 semanas
- **Total**: 9-12 semanas (2.5-3 meses)

---

## ✅ Migración a Hostinger MySQL (Diciembre 2025)

### Configuración del Servidor ✅
- [x] VPS Ubuntu en Hostinger (IP: 31.97.246.42)
- [x] Instalación de MySQL Server
- [x] Creación de base de datos `aserradero_db`
- [x] Creación de usuario `aserradero_user`
- [x] Configuración de firewall (puertos SSH, MySQL, HTTP/S)
- [x] Configuración de MySQL para conexiones remotas

### Migración de Datos ✅
- [x] Scripts históricos de migración (deprecados en repo; operación diaria = MySQL)
- [x] Creación de tablas en MySQL (`create_tables_mysql.sql`)
- [x] Importación de datos (clientes, artículos, remitos, pagos)
- [x] Verificación y corrección de datos migrados

### Modificación de la App ✅
- [x] Instalación de driver mysql2
- [x] Servicio de MySQL (`database/mysqlService.js`)
- [x] Handlers IPC en Electron (`main.js`)
- [x] API en preload.js
- [x] Servicio para React (`hostingerService.js`)
- [x] Selector de base de datos (`databaseService.js`)
- [x] Corrección de formato de fechas (Date vs String)
- [x] Filtro de pagos ocultos `[OCULTO]`

### Configuración Actual
- **App (Electron)**: Conecta a MySQL Hostinger vía IPC (`mysql:*`)
- **Cambiar base de datos**: Editar `database/mysqlService.js` (host/usuario/base) **con cuidado** (dev vs prod)

### Credenciales Hostinger MySQL
- Host: `31.97.246.42`
- Puerto: `3306`
- Base de datos: `aserradero_db`
- Usuario: `aserradero_user`

---

## ✅ Release 2.1.1 (Abril 2026)

- [x] Versión **2.1.1** (`package.json`): instalador `Aserradero.App-2.1.1-Setup.exe` (electron-builder)
- [x] Cuentas corrientes: en UI se muestra saldo neto (si pagó más, aparece saldo a favor; si no, pendiente)
- [x] Exports PDF/Excel: Total Pagado incluye aplicado de saldo a favor; Total Facturado incluye saldo inicial en contra; S.I. sin signo negativo

## ✅ Release 2.0.10 (Marzo 2026)

- [x] Versión **2.0.10** (`package.json`): instalador `Aserradero.App-2.0.10-Setup.exe` (electron-builder)
- [x] Reportes de error: `app_version` alineada con `app.getVersion()` en Electron
- [x] Sin dependencias cloud en runtime; MySQL + IPC

## ✅ Actualización Marzo 2026

- [x] Limpieza de restos legacy (frontend + dependencias + scripts con credenciales embebidas)
- [x] Reportes de error: guardado en MySQL (`error_reports`) + corrección de “éxito falso” si falla el INSERT
- [x] `App.js`: ya no bloquea el arranque por inicialización legacy del cliente cloud
- [x] `config.json.example` sin secretos; `config:get` sin credenciales

*Última actualización: Marzo 2026 — v2.1.1; MySQL Hostinger como backend único*

