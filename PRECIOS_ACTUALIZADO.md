# Precios Actualizados - Aserradero App

## 📊 Precio Actual de la App (Versión 1.0)

### Precio Recomendado para 4 PC Simultáneas

**Licencia Única Multi-PC**: **$2.500 USD** / **$3.750.000 ARS**

Esto incluye:
- ✅ Instalación en hasta 4 computadoras
- ✅ Capacitación inicial (2-4 horas)
- ✅ Configuración inicial de la base de datos Supabase
- ✅ Documentación de usuario
- ✅ Soporte técnico los primeros 30 días

### Plan de Mantenimiento Mensual

**Plan Estándar (Recomendado)**: **$150 USD** / **$225.000 ARS** mensuales

**Incluye:**
- ✅ Todo lo del Plan Básico
- ✅ Nuevas funcionalidades menores (según solicitud)
- ✅ Respaldo de base de datos (diario)
- ✅ Actualizaciones de seguridad
- ✅ Soporte por videollamada (hasta 2 horas/mes)
- ⏰ Tiempo de respuesta: 12-24 horas hábiles

---

## 🔐 Versión 2.0 con Usuarios y Sistema de Auditoría

### Funcionalidades Adicionales que se Implementarán en el Futuro:

**NOTA IMPORTANTE**: Todo está en Supabase (base de datos centralizada). El sistema de usuarios sería para las 4 PC actuales, con 5 usuarios fijos: 4 vendedores + 1 dueño.

1. **Sistema de Usuarios y Autenticación (Máximo 5 usuarios)**
   - **Usuarios fijos**: 4 vendedores + 1 dueño (no es sistema de registro abierto)
   - Login con usuario y contraseña para identificar quién usa cada PC
   - **Propósito principal**: Saber quién hizo cada cambio (auditoría)
   - Roles básicos:
     - **Vendedor**: Puede crear/editar remitos, registrar pagos, ver reportes
     - **Dueño/Administrador**: Permisos especiales (se consultará qué puede hacer exactamente)
   - Configuración de usuarios desde la app (solo el dueño puede crear/editar usuarios)
   - No requiere registro externo, son usuarios internos fijos

2. **Sistema de Auditoría Completo (Propósito Principal)**
   - **Objetivo**: Prevenir fugas de dinero y saber quién hizo cada cambio
   - Historial de todas las modificaciones en remitos
     - Registro de quién modificó (nombre del vendedor/dueño)
     - Registro de cuándo modificó (fecha y hora)
     - Registro de qué cambió (valores antes/después)
   - Historial de cambios en artículos/productos
     - Cambios en precios (quién, cuándo, de qué a qué)
     - Activación/desactivación de productos
   - Historial de cambios en clientes
     - Modificaciones de datos
     - Eliminaciones
   - Historial de pagos registrados
     - Quién registró cada pago
     - Modificaciones o cancelaciones de pagos
   - Vista de historial en cada remito/artículo/cliente
     - Tabla con todos los cambios realizados
     - Mostrar usuario, fecha/hora, tipo de cambio, valores antes/después
   - Reportes de auditoría
     - Reporte general de todos los cambios
     - Reporte por usuario (qué hizo cada vendedor)
     - Reporte por fecha (cambios en un período)
     - Detección de anomalías (cambios grandes, muchos cambios en poco tiempo)
   - Alertas de seguridad
     - Alertas por cambios grandes en montos
     - Alertas por muchas modificaciones en poco tiempo
     - Alertas por eliminaciones

3. **Seguridad Adicional**
   - Logs de acceso al sistema (quién entró y cuándo)
   - Alertas por actividades sospechosas
   - Backup automático antes de cambios críticos
   - Datos ya están en Supabase (centralizados y seguros)

### Precio Versión 2.0 con Usuarios y Auditoría

**Licencia Única Multi-PC (v2.0)**: **$3.500 USD** / **$5.250.000 ARS**

**Incremento**: +$1.000 USD / +$1.500.000 ARS (40% adicional)

**Especificaciones:**
- **Usuarios**: Hasta 5 usuarios fijos (4 vendedores + 1 dueño)
- **Enfoque principal**: Sistema de auditoría para prevenir fugas de dinero
- **Base de datos**: Supabase (ya implementado, centralizado)

**Justificación del precio:**
- Desarrollo de sistema de usuarios (5 usuarios fijos): +$400 USD
- Sistema de auditoría completo (historial de cambios): +$600 USD
- Mejoras de seguridad y logs: +$200 USD
- Testing y documentación adicional: +$200 USD
- **Total incremento de desarrollo**: $1.400 USD de costo
- **Precio de venta con margen**: +$1.000 USD (30% margen)

### Plan de Mantenimiento para v2.0

**Plan Estándar v2.0**: **$200 USD** / **$300.000 ARS** mensuales

**Incluye todo lo del plan estándar actual, más:**
- ✅ Mantenimiento del sistema de usuarios
- ✅ Monitoreo de logs de auditoría
- ✅ Análisis de reportes de seguridad
- ✅ Actualizaciones de permisos y roles

---

## 💰 Comparación de Precios

### Primer Año de Uso

| Versión | Licencia Inicial | Mantenimiento (12 meses) | **Total Primer Año** |
|---------|------------------|--------------------------|----------------------|
| **v1.0 (Actual)** | $2.500 USD | $1.530 USD* | **$4.030 USD** / **$6.045.000 ARS** |
| **v2.0 (Con Auditoría)** | $3.500 USD | $2.040 USD* | **$5.540 USD** / **$8.310.000 ARS** |
| **Diferencia** | +$1.000 USD | +$510 USD | **+$1.510 USD** / **+$2.265.000 ARS** |

*Con descuento del 15% por pago anual

---

## 📅 Plan de Implementación Futura

### Fase 1: Sistema de Usuarios (Implementación posterior)
- **Tiempo estimado**: 3-4 semanas de desarrollo
- **Funcionalidades**:
  - Login/Autenticación (5 usuarios fijos: 4 vendedores + 1 dueño)
  - Roles básicos: Vendedor y Dueño/Administrador
  - Permisos: El dueño tendría permisos especiales (a consultar con el cliente)
  - Gestión de usuarios (solo el dueño puede crear/editar)
  - **Propósito principal**: Identificar quién hace cada cambio (auditoría)
- **Costo adicional para clientes existentes**: $500 USD
- **NOTA**: Los permisos especiales del dueño se consultarán cuando se venda la app

### Fase 2: Sistema de Auditoría (Implementación posterior)
- **Tiempo estimado**: 4-5 semanas de desarrollo
- **Funcionalidades**:
  - Historial completo de cambios
  - Registro de quién hizo qué
  - Reportes de auditoría
  - Alertas de seguridad
- **Costo adicional para clientes existentes**: $700 USD

### Fase 3: Actualizaciones de Seguridad (Implementación posterior)
- **Tiempo estimado**: 2-3 semanas de desarrollo
- **Funcionalidades**:
  - Encriptación adicional
  - Logs de acceso
  - Mejoras de seguridad
- **Costo adicional para clientes existentes**: $300 USD

**Total para actualizar de v1.0 a v2.0**: $1.500 USD (con descuento del 40% sobre el precio nuevo)

---

## 🎯 Recomendación para el Cliente

### Opción 1: Comenzar con v1.0 y Actualizar Después
- **Ventaja**: Comienza a usar la app de inmediato
- **Costo inicial**: $2.500 USD
- **Costo de actualización**: $1.500 USD (cuando esté lista)
- **Total eventual**: $4.000 USD (ahorro de $1.040 USD vs comprar v2.0 directamente)

### Opción 2: Pre-Compra de v2.0
- **Ventaja**: Obtiene la versión completa desde el inicio
- **Costo inicial**: $3.500 USD
- **Actualizaciones gratuitas**: Incluidas cuando estén listas
- **Mejor para**: Clientes que necesitan seguridad desde el día 1

---

## 📝 Funcionalidad Futura Anotada

**Nota de Desarrollo**: Esta funcionalidad está anotada para implementación futura:
- ✅ Sistema de usuarios y autenticación
- ✅ Historial de modificaciones (auditoría)
- ✅ Registro de quién hizo cada cambio
- ✅ Protección contra fugas de dinero
- ✅ Reportes de auditoría

**Prioridad**: Alta (para prevenir fraudes y mejorar trazabilidad)

**Fecha estimada de desarrollo**: Pendiente de confirmación del cliente

---

*Documento creado: Noviembre 2025*

