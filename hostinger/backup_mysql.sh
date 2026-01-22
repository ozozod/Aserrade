#!/bin/bash
# ===========================================
# SCRIPT DE BACKUP AUTOMÁTICO - ASERRADERO
# Ejecutar en el VPS de Hostinger
# ===========================================

# Configuración
DB_NAME="aserradero_db"
DB_USER="aserradero_user"
DB_PASS="Aserradero2025#"
BACKUP_DIR="/home/backups/aserradero"
DAYS_TO_KEEP=30

# Crear directorio de backups si no existe
mkdir -p $BACKUP_DIR

# Fecha y hora para el nombre del archivo
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/aserradero_backup_$TIMESTAMP.sql"
BACKUP_COMPRESSED="$BACKUP_DIR/aserradero_backup_$TIMESTAMP.sql.gz"

echo "🚀 Iniciando backup de Aserradero..."
echo "📅 Fecha: $(date)"
echo ""

# Hacer el backup de MySQL
echo "📦 Creando backup de la base de datos..."
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Backup creado exitosamente: $BACKUP_FILE"
    
    # Comprimir el backup
    echo "🗜️  Comprimiendo backup..."
    gzip $BACKUP_FILE
    
    # Mostrar tamaño
    SIZE=$(du -h $BACKUP_COMPRESSED | cut -f1)
    echo "📁 Tamaño del backup: $SIZE"
    
    # Eliminar backups antiguos (más de X días)
    echo "🗑️  Eliminando backups antiguos (más de $DAYS_TO_KEEP días)..."
    find $BACKUP_DIR -name "aserradero_backup_*.sql.gz" -mtime +$DAYS_TO_KEEP -delete
    
    # Contar backups actuales
    COUNT=$(ls -1 $BACKUP_DIR/aserradero_backup_*.sql.gz 2>/dev/null | wc -l)
    echo "📊 Backups almacenados: $COUNT"
    
    echo ""
    echo "✅ Backup completado exitosamente!"
else
    echo "❌ Error al crear el backup"
    exit 1
fi

# Mostrar espacio disponible
echo ""
echo "💾 Espacio en disco:"
df -h $BACKUP_DIR | tail -1

