#!/bin/bash
# Script de instalación de MySQL para Aserradero App
# Ejecutar como: bash instalar_mysql.sh

echo "🚀 Instalando MySQL Server..."
apt update
apt install mysql-server -y

echo "🔧 Configurando MySQL..."
# Configurar MySQL para aceptar conexiones externas
sed -i 's/bind-address.*=.*/bind-address = 0.0.0.0/' /etc/mysql/mysql.conf.d/mysqld.cnf

echo "🔄 Reiniciando MySQL..."
systemctl restart mysql
systemctl enable mysql

echo "📦 Creando base de datos y usuario..."
mysql -e "CREATE DATABASE IF NOT EXISTS aserradero_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS 'aserradero_user'@'%' IDENTIFIED BY 'Aserradero2025#';"
mysql -e "GRANT ALL PRIVILEGES ON aserradero_db.* TO 'aserradero_user'@'%';"
mysql -e "FLUSH PRIVILEGES;"

echo "✅ MySQL instalado y configurado!"
echo ""
echo "📋 Credenciales de la base de datos:"
echo "   Host: 31.97.246.42"
echo "   Puerto: 3306"
echo "   Base de datos: aserradero_db"
echo "   Usuario: aserradero_user"
echo "   Contraseña: Aserradero2025#"
echo ""
echo "🎉 ¡Listo! Ahora ejecuta el script SQL para crear las tablas."

