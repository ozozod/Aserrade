# Migración / importación a MySQL (Hostinger) — estado actual

> **AVISO:** esta guía reemplaza versiones antiguas que mencionaban proveedores cloud tipo Postgres. La app actual opera **100% MySQL**.

## Objetivo

Crear el esquema e importar datos en `aserradero_db` (o el nombre que uses en Hostinger).

## 1) Crear tablas

1. Abrí phpMyAdmin (o cliente MySQL)
2. Seleccioná la base de datos
3. Ejecutá el SQL de `create_tables_mysql.sql`

## 2) Importar datos

Depende de qué tengas como fuente:

- **Si tenés un `.sql` de backup**: importalo directamente (phpMyAdmin → Importar, o `mysql < archivo.sql`).
- **Si tenés CSV** exportados históricamente: importá tabla por tabla cuidando columnas y FKs.
- **Si estás clonando prod → dev**: usá backup SQL consistente (y verificá que no pises datos).

## 3) Verificación rápida

- Conteos básicos (`SELECT COUNT(*)`) en tablas principales
- Probar login y carga de listas en la app (Electron)

## Scripts Node removidos

Se eliminaron del repo scripts de migración con credenciales embebidas. Si necesitás una migración puntual, hacela con **SQL** y procedimientos controlados (no commitees secretos).
