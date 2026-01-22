# Guía de Usuario - Aserradero App

## 🚀 Iniciar la Aplicación

1. Buscar **"Aserradero App"** en el menú de inicio de Windows
2. Hacer doble clic en el ícono
3. La aplicación se abrirá automáticamente

## 📋 Primeros Pasos

### 1. Crear Clientes

Antes de crear remitos, es necesario tener clientes registrados.

1. En el menú lateral, hacer clic en **"👥 Clientes"**
2. Clic en **"➕ Nuevo Cliente"**
3. Completar:
   - **Nombre**: Nombre completo del cliente (obligatorio)
   - **Teléfono**: Número de contacto (opcional)
   - **Dirección**: Dirección del cliente (opcional)
   - **Email**: Correo electrónico (opcional)
   - **Observaciones**: Notas adicionales (opcional)
4. Clic en **"✅ Guardar"**

### 2. Crear un Remito

1. En el menú lateral, hacer clic en **"📋 Remitos"**
2. Clic en **"➕ Nuevo Remito"**
3. Completar los datos:

   **Datos Básicos:**
   - **Cliente**: Seleccionar de la lista (obligatorio)
   - **Fecha**: Fecha del remito (obligatorio)
   - **Número de Remito**: Número del remito físico (opcional)

   **Producto:**
   - **Artículo**: Seleccionar tipo de cajón
     - Cajón Estándar
     - Cajón Pequeño
     - Cajón Grande
     - Media Caja
     - Otro
   - **Cantidad**: Cantidad de cajones
   - **Precio Unitario**: Precio por unidad

   **El Precio Total se calcula automáticamente**

   **Pago:**
   - **Estado de Pago**: 
     - **Pendiente**: No se ha pagado
     - **Pago Parcial**: Se pagó una parte
     - **Pagado**: Completamente pagado
   - **Monto Pagado**: Si seleccionaste "Pago Parcial" o "Pagado", indicar cuánto se pagó

4. **Observaciones**: Notas adicionales sobre el remito (opcional)
5. Clic en **"✅ Guardar"**

### 3. Registrar un Pago

Cuando un cliente realiza un pago:

1. En el menú lateral, hacer clic en **"💰 Pagos"**
2. Clic en **"➕ Nuevo Pago"**
3. Completar:
   - **Remito**: Seleccionar el remito pendiente de pago
   - **Fecha**: Fecha del pago
   - **Monto a Pagar**: Monto que se está pagando
   - **Observaciones**: Notas sobre el pago (opcional)
4. Clic en **"✅ Registrar Pago"**

**Nota**: El estado del remito se actualiza automáticamente:
- Si el pago completa el total, el remito pasa a "Pagado"
- Si el pago es parcial, el remito pasa a "Pago Parcial"
- Si el remito ya estaba pagado y se registra un pago adicional, se suma

### 4. Ver Cuenta Corriente de un Cliente

1. En el menú lateral, hacer clic en **"📊 Reportes"**
2. Seleccionar el cliente del menú desplegable
3. Se mostrará:
   - Información del cliente
   - Resumen de totales
   - Lista completa de remitos con saldos

### 5. Exportar Reportes

#### Exportar Cuenta Corriente

1. Ir a **"📊 Reportes"**
2. Seleccionar un cliente
3. Clic en **"📄 Exportar PDF"** o **"📊 Exportar Excel"**
4. El archivo se guardará en la carpeta de Descargas

#### Exportar Resumen General

1. Ir a **"📈 Resumen General"**
2. Ver estadísticas generales
3. Clic en **"📄 Exportar PDF"** o **"📊 Exportar Excel"**
4. El archivo se guardará en la carpeta de Descargas

## 📊 Resumen General

En esta sección puedes ver:
- Total de clientes registrados
- Total de remitos emitidos
- Total facturado
- Total pagado
- Total pendiente de cobro
- Lista de los últimos remitos

## 💡 Consejos

- **Siempre crear clientes primero** antes de emitir remitos
- **El precio total se calcula automáticamente** multiplicando cantidad × precio unitario
- **Los estados de pago se actualizan automáticamente** cuando registras pagos
- **Exporta reportes regularmente** para tener respaldos
- **La base de datos se guarda automáticamente** - no necesitas guardar manualmente

## ⚠️ Importante

- Si eliminas un cliente que tiene remitos asociados, puede generar errores
- Los remitos eliminados también eliminan sus pagos relacionados
- Los archivos exportados se guardan en la carpeta de Descargas

## 🆘 Problemas Comunes

### La aplicación no inicia
- Verificar que el programa esté correctamente instalado
- Reiniciar la computadora
- Contactar al soporte técnico

### No se puede guardar un remito
- Verificar que todos los campos obligatorios estén completos
- Verificar que el cliente esté seleccionado
- Verificar que los precios sean números válidos

### El pago no se registra
- Verificar que el remito tenga saldo pendiente
- Verificar que el monto no exceda el saldo pendiente

## 📞 Soporte

Para reportar errores o solicitar ayuda, contactar al desarrollador.

