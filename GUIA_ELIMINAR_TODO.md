# 🗑️ Resetear datos (MySQL) — guía corta

> **Peligro:** esto puede ser **irreversible**. Hacé backup SQL antes.

## Opción recomendada

1. Exportá un backup `.sql` (app o `mysqldump`)
2. Ejecutá SQL en MySQL para borrar datos (según tu necesidad)

### Ejemplo (borrar datos de tablas principales)

Ajustá nombres según tu esquema. **No ejecutes en producción** sin confirmar.

```sql
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE remito_articulos;
TRUNCATE TABLE pagos;
TRUNCATE TABLE remitos;
TRUNCATE TABLE articulos;
TRUNCATE TABLE clientes;
-- agregá/quitá tablas según tu caso
SET FOREIGN_KEY_CHECKS = 1;
```

## Imágenes

Si las fotos están en `remitos.foto_path` como data URL, al truncar `remitos` también desaparecen.

## Nota histórica

Versiones viejas del repo mencionaban scripts Node para limpiar storage cloud; **ya no aplican** al modelo MySQL actual.
