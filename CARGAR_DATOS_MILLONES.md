# Cargar Datos de Prueba con Valores Superiores al Millón

Este documento explica cómo eliminar todos los datos existentes y cargar nuevos datos de prueba con valores superiores al millón para probar los reportes.

## Pasos para Cargar los Datos

### 1. Eliminar Todos los Datos Existentes

1. Abre el **SQL Editor** en Supabase
2. Abre el archivo `supabase/eliminar_todos_datos.sql`
3. Copia todo el contenido del archivo
4. Pégalo en el SQL Editor de Supabase
5. Haz clic en **Run** (o presiona `Ctrl+Enter`)
6. Verifica que todos los contadores muestren `0`

### 2. Cargar Datos de Prueba con Valores Grandes

1. En el mismo SQL Editor de Supabase
2. Abre el archivo `supabase/datos_prueba_millones.sql`
3. Copia todo el contenido del archivo
4. Pégalo en el SQL Editor de Supabase
5. Haz clic en **Run** (o presiona `Ctrl+Enter`)
6. Deberías ver un mensaje: `Datos de prueba insertados correctamente con valores superiores al millón`

## Datos que se Insertarán

### Clientes (4 empresas grandes):
- **Empresa Distribuidora S.A.** - Cliente principal con grandes volúmenes
- **Frutas y Verduras del Sur S.R.L.** - Cliente con pedidos mensuales grandes
- **Exportadora Patagónica** - Cliente exportador
- **Supermercados Unidos** - Cadena de supermercados

### Artículos:
- Cajón Estándar: $1.500,00
- Cajón Grande: $2.500,00
- Cajón Premium: $3.200,00
- Cajón Exportación: $4.500,00

### Remitos con Valores Superiores al Millón:

**Empresa Distribuidora S.A.:**
- REM-1001: $1.250.000,00 (Pendiente)
- REM-1002: $1.280.000,00 (Pago Parcial - $500.000 pagados)
- REM-1003: $2.500.000,00 (Pagado)

**Frutas y Verduras del Sur S.R.L.:**
- REM-2001: $2.590.000,00 (Pendiente)
- REM-2002: $2.700.000,00 (Pago Parcial - $1.000.000 pagados)
- REM-2003: $3.550.000,00 (Pagado)

**Exportadora Patagónica:**
- REM-3001: $3.600.000,00 (Pendiente)
- REM-3002: $4.500.000,00 (Pago Parcial - $2.000.000 pagados)

**Supermercados Unidos:**
- REM-4001: $2.800.000,00 (Pendiente)
- REM-4002: $4.140.000,00 (Pagado)

## Verificar los Datos

Después de cargar, puedes ejecutar esta consulta en Supabase para ver un resumen:

```sql
SELECT 
  c.nombre as cliente,
  COUNT(DISTINCT r.id) as total_remitos,
  SUM(r.precio_total) as total_facturado,
  SUM(r.monto_pagado) as total_pagado,
  SUM(r.precio_total - COALESCE(r.monto_pagado, 0)) as total_pendiente
FROM clientes c
LEFT JOIN remitos r ON c.id = r.cliente_id
GROUP BY c.id, c.nombre
ORDER BY total_facturado DESC;
```

## Probar los Reportes

Una vez cargados los datos:

1. Abre la aplicación
2. Ve a la pestaña **Clientes**
3. Haz clic en **📄 PDF** o **📊 Excel** en cualquier cliente
4. Verifica que los valores se muestren correctamente con el formato argentino (1.000.000,34)
5. Verifica que el PDF no se corte y que el fondo gris del resumen cubra todo el contenido

## Notas

- Los valores están diseñados para probar el formato de números grandes
- Hay una mezcla de estados: Pendiente, Pago Parcial y Pagado
- Los remitos tienen múltiples artículos para probar la visualización completa
- Los totales por cliente superan los 2 millones de pesos

