#!/bin/bash
# Script para crear base de datos de desarrollo desde terminal SSH
# Ejecutar en el servidor Hostinger: bash crear_base_desarrollo_terminal.sh

echo "🚀 Creando base de datos de desarrollo..."

# Conectar a MySQL y ejecutar comandos
mysql -u root -p << EOF
CREATE DATABASE IF NOT EXISTS aserradero_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aserradero_dev;
SELECT 'Base de datos aserradero_dev creada correctamente' AS mensaje;
EOF

echo "✅ Base de datos creada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Copiar estructura de tablas desde aserradero_db (producción)"
echo "2. Ejecutar v1.2_usuarios_auditoria.sql para crear tablas de usuarios y auditoría"
echo ""
echo "Para copiar estructura de tablas:"
echo "mysqldump -u root -p --no-data aserradero_db > estructura_produccion.sql"
echo "sed -i 's/aserradero_db/aserradero_dev/g' estructura_produccion.sql"
echo "mysql -u root -p aserradero_dev < estructura_produccion.sql"

