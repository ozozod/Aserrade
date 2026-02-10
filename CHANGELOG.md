# 📝 REGISTRO DE ACTUALIZACIONES - ASERRADERO v2

Este archivo documenta todos los cambios, parches y mejoras aplicadas a la aplicación.

---


## [Versión 2.0.5] - 2026-02-06

### 🐛 Correcciones de Bugs
- **Botón Aplicar adelanto**: Al hacer clic en "Aplicar" en un adelanto, ya no muestra "Este cliente no tiene remitos pendientes". Ahora se obtienen los remitos del cliente desde la base con `getCuentaCorriente` y se filtran por saldo pendiente > 0, sin depender del caché.
- **Verificación de actualizaciones**: Si falla la verificación (sin releases o sin red) se muestra "Aplicación actualizada" y se continúa sin mensaje de error.

### 🔧 Cambios Técnicos
- `handleAplicarAdelanto`: usa `getCuentaCorriente(clienteId)` para cargar remitos pendientes en lugar del estado local.
- AutoUpdater: en errores se envía `update-not-available` para no mostrar error al usuario.

---

## [Versión 2.0.4] - 2026-02-06

### 🐛 Correcciones de Bugs
- **Pagos distribuidos (varios remitos)**: Corregido que en la tabla de Pagos se mostrara $ 0,00 en la columna Monto. El parseo de `REMITOS_DETALLE` en observaciones fallaba porque el regex incluía el texto `PAGO_GRUPO_ID:...` y rompía el JSON. Ahora se extrae solo el array JSON y se muestra el monto total correcto.
- **Cuenta corriente tras borrar pagos**: Los totales y saldos por remito se calculan siempre desde la tabla `pagos` (no desde `remitos.monto_pagado`), para que al eliminar pagos la vista coincida con los datos reales y no siga mostrando "tiene pagos" o saldos incorrectos.

### 🔧 Cambios Técnicos
- `parsearRemitosDesdeObservaciones`: nuevo regex para capturar solo el array JSON de REMITOS_DETALLE (excluyendo PAGO_GRUPO_ID).
- `getCuentaCorriente` (mysqlService y reportesController): total_pagado y monto_pagado por remito calculados desde la suma de pagos reales.

---

## [Versión 2.0.3] - 2026-01-27

### 🐛 Correcciones de Bugs
- **AutoUpdater**: Corregido owner en package.json (eliminado espacio en "ozozo d" → "ozozod")
- **Actualizaciones Automáticas**: Agregada configuración explícita de repositorio GitHub en autoUpdater

### 🔧 Cambios Técnicos
- Configurado `autoUpdater.setFeedURL()` explícitamente con owner y repo correctos
- Corregido `package.json` publish.owner de "ozozo d" a "ozozod"

---

## [Versión 2.0.2] - 2026-01-27

### 🐛 Correcciones de Bugs
- **Exportación de Deudores**: Corregido acceso a `totales.total_pendiente` en resumen general
- **Archivos Vacíos**: Los exports de deudores ahora muestran correctamente los datos de los clientes

### ✨ Mejoras
- **Botones de Exportar**: Mejorado manejo de errores y estados de carga en exportación PDF/Excel
- **Validaciones**: Agregadas validaciones para evitar exportar archivos vacíos
- **Feedback al Usuario**: Mensajes de error más claros y descriptivos

### 🔧 Cambios Técnicos
- Corregido acceso a `cuenta.totales.total_pendiente` en lugar de `cuenta.totalPendiente`
- Agregado estado `exportandoExcel` para mejor UX
- Mejorado manejo de errores con try-catch y logging

---


## [Versión 2.0.1] - 2026-01-21

### 🐛 Correcciones de Bugs
- **Filtrado de fechas**: Corregido bug que mostraba fechas con un día de diferencia en exports
- **Pagos en rango**: Los pagos ahora aparecen correctamente cuando se filtra por fechas
- **Saldo en resumen**: Arreglado texto corrupto cuando saldo = 0 (ahora muestra "$ 0,00")
- **Período en exports**: Las fechas del encabezado ahora coinciden con las seleccionadas

### ✨ Mejoras
- **Sincronización Clientes-Reportes**: Los botones de exportar en Clientes ahora usan la misma lógica que Reportes
- **Cálculo de DEBE**: La columna DEBE ahora refleja el historial completo incluso con filtros de fecha
- **Resumen Financiero**: Totales siempre muestran el historial completo del cliente

### 🔧 Cambios Técnicos
- Unificada lógica de `ejecutarExportacion` entre Clientes.js y Reportes.js
- Implementado `parseDateOnly` para evitar corrimientos de zona horaria
- Agregado `remitosHistorico` y `pagosHistorico` para cálculos precisos

---

## [Versión 2.0.0] - 2026-01-15

### 🎉 Lanzamiento Inicial v2
- Sistema de auditoría completo
- Login de usuarios con roles
- Interfaz mejorada con modo oscuro
- Reportes PDF y Excel profesionales
- Gestión de remitos con imágenes
- Sistema de pagos con cheques rebotados

---

## 📋 FORMATO DE REGISTRO PARA FUTUROS PARCHES

### [Versión X.Y.Z] - AAAA-MM-DD

#### 🐛 Correcciones de Bugs
- Descripción breve del bug corregido

#### ✨ Mejoras
- Descripción de nuevas funcionalidades

#### 🔧 Cambios Técnicos
- Detalles técnicos para desarrolladores

#### ⚠️ Breaking Changes (si aplica)
- Cambios que requieren acción del usuario

---

## 🔢 VERSIONADO SEMÁNTICO

Usamos **Semantic Versioning** (X.Y.Z):
- **X (Major)**: Cambios grandes que rompen compatibilidad
- **Y (Minor)**: Nuevas funcionalidades (compatible)
- **Z (Patch)**: Correcciones de bugs

**Ejemplos:**
- `2.0.0` → `2.0.1`: Bug fix (patch)
- `2.0.1` → `2.1.0`: Nueva función (minor)
- `2.1.0` → `3.0.0`: Rediseño completo (major)
