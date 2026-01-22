#!/bin/bash
# ==================================================
# BACKUP COMPLETO ASERRADERO - MySQL + Imágenes
# Ejecutar: bash backup_completo.sh
# ==================================================

# CONFIGURACIÓN
DB_NAME="aserradero_db"
DB_USER="aserradero_user"
DB_PASS="Aserradero2025#"
BACKUP_DIR="/home/backups/aserradero"
DAYS_TO_KEEP=90  # 3 meses de backups
GDRIVE_FOLDER="Backups/Aserradero"

# Crear directorios
mkdir -p $BACKUP_DIR
mkdir -p $BACKUP_DIR/temp

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_SQL="$BACKUP_DIR/temp/database_$TIMESTAMP.sql"
BACKUP_FINAL="$BACKUP_DIR/aserradero_backup_$TIMESTAMP.tar.gz"
LOG_FILE="/home/backups/backup.log"

echo "========================================" >> $LOG_FILE
echo "$(date): 🚀 Iniciando backup completo..." >> $LOG_FILE

# 1. BACKUP DE BASE DE DATOS
echo "$(date): 📦 Exportando base de datos..." >> $LOG_FILE
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME 2>/dev/null > $BACKUP_SQL

if [ ! -s $BACKUP_SQL ]; then
    echo "$(date): ❌ ERROR: Fallo en mysqldump" >> $LOG_FILE
    rm -rf $BACKUP_DIR/temp
    exit 1
fi

DB_SIZE=$(du -h $BACKUP_SQL | cut -f1)
echo "$(date): ✅ Base de datos exportada: $DB_SIZE" >> $LOG_FILE

# 2. COMPRIMIR TODO
echo "$(date): 🗜️ Comprimiendo backup..." >> $LOG_FILE
cd $BACKUP_DIR/temp
tar -czf $BACKUP_FINAL .

# Limpiar temporal
rm -rf $BACKUP_DIR/temp

FINAL_SIZE=$(du -h $BACKUP_FINAL | cut -f1)
echo "$(date): ✅ Backup comprimido: $FINAL_SIZE" >> $LOG_FILE

# 3. SUBIR A GOOGLE DRIVE (si rclone está configurado)
if command -v rclone &> /dev/null && rclone listremotes | grep -q "gdrive:"; then
    echo "$(date): ☁️ Subiendo a Google Drive..." >> $LOG_FILE
    rclone copy $BACKUP_FINAL gdrive:$GDRIVE_FOLDER/ 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "$(date): ✅ Subido a Google Drive: $GDRIVE_FOLDER/" >> $LOG_FILE
    else
        echo "$(date): ⚠️ Error subiendo a Google Drive" >> $LOG_FILE
    fi
else
    echo "$(date): ℹ️ Google Drive no configurado (rclone)" >> $LOG_FILE
fi

# 4. LIMPIAR BACKUPS ANTIGUOS (local)
echo "$(date): 🗑️ Eliminando backups locales > $DAYS_TO_KEEP días..." >> $LOG_FILE
DELETED=$(find $BACKUP_DIR -name "aserradero_backup_*.tar.gz" -mtime +$DAYS_TO_KEEP -delete -print | wc -l)
echo "$(date): 🗑️ Eliminados: $DELETED backups antiguos" >> $LOG_FILE

# 5. LIMPIAR BACKUPS ANTIGUOS (Google Drive)
if command -v rclone &> /dev/null && rclone listremotes | grep -q "gdrive:"; then
    echo "$(date): 🗑️ Limpiando Google Drive > $DAYS_TO_KEEP días..." >> $LOG_FILE
    rclone delete gdrive:$GDRIVE_FOLDER/ --min-age ${DAYS_TO_KEEP}d 2>/dev/null
fi

# 6. RESUMEN
TOTAL_BACKUPS=$(ls -1 $BACKUP_DIR/aserradero_backup_*.tar.gz 2>/dev/null | wc -l)
DISK_USED=$(du -sh $BACKUP_DIR 2>/dev/null | cut -f1)

echo "$(date): ========================================" >> $LOG_FILE
echo "$(date): ✅ BACKUP COMPLETADO" >> $LOG_FILE
echo "$(date): 📁 Archivo: $BACKUP_FINAL" >> $LOG_FILE
echo "$(date): 📊 Tamaño: $FINAL_SIZE" >> $LOG_FILE
echo "$(date): 💾 Backups locales: $TOTAL_BACKUPS" >> $LOG_FILE
echo "$(date): 💿 Espacio usado: $DISK_USED" >> $LOG_FILE
echo "$(date): ========================================" >> $LOG_FILE

# Mostrar en consola
echo ""
echo "✅ BACKUP COMPLETADO"
echo "📁 Archivo: $BACKUP_FINAL"
echo "📊 Tamaño: $FINAL_SIZE"
echo "💾 Backups locales: $TOTAL_BACKUPS"
echo ""

