# Cargar Datos Masivos de Prueba

Este script carga datos masivos de prueba en la base de datos:
- **200 clientes** con datos variados
- **1000 remitos** distribuidos en los últimos 180 días
- **Múltiples artículos por remito** (1-4 artículos)
- **Pagos variados** (70% pendientes, 20% pagados, 10% parciales)

## Pasos para ejecutar:

1. Abre el **SQL Editor** de Supabase
2. Copia y pega el contenido del archivo `supabase/datos_masivos.sql`
3. Ejecuta el script

## Características de los datos generados:

### Clientes (200):
- Nombres variados (Supermercados, Distribuidoras, Exportadoras, etc.)
- Teléfonos con formato argentino
- Direcciones en CABA con barrios variados
- Emails únicos
- Algunos con observaciones de "Cliente frecuente"

### Remitos (1000):
- Distribuidos en los últimos **180 días**
- Fechas más recientes tienen mayor probabilidad
- Numeración secuencial: REM-000001, REM-000002, etc.
- **70% pendientes** (700 remitos)
- **20% completamente pagados** (200 remitos)
- **10% con pago parcial** (100 remitos)

### Artículos por Remito:
- Entre **1 y 4 artículos** por remito
- Cantidades aleatorias entre **50 y 5000**
- Precios unitarios variados (±20% del precio base)
- Artículos más comunes: Estándar y Grande
- Artículos menos comunes: Premium y Exportación

### Pagos:
- Remitos pagados: **1-3 pagos** por remito
- Remitos parciales: **1-3 pagos** por remito
- Fechas de pago aleatorias entre la fecha del remito y hoy
- Montos que suman el total pagado del remito

## Tiempo estimado de ejecución:
- **2-5 minutos** dependiendo del servidor de Supabase

## Notas:
- El script muestra el progreso cada 100 remitos
- Al finalizar, muestra un resumen completo de los datos insertados
- Los datos se eliminan automáticamente antes de insertar los nuevos

