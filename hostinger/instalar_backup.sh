#!/bin/bash
# ==================================================
# INSTALADOR DE BACKUP AUTOMÁTICO - ASERRADERO
# Copiar y pegar todo este contenido en SSH
# ==================================================

echo "🚀 Instalando sistema de backup automático..."

# Crear directorios
mkdir -p /home/backups/aserradero

# Crear script de backup
cat > /home/backups/backup_aserradero.sh << 'EOF'
#!/bin/bash
DB_NAME="aserradero_db"
DB_USER="aserradero_user"
DB_PASS="Aserradero2025#"
BACKUP_DIR="/home/backups/aserradero"
DAYS_TO_KEEP=30

mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/aserradero_backup_$TIMESTAMP.sql.gz"

echo "$(date): Iniciando backup..." >> /home/backups/backup.log
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME 2>/dev/null | gzip > $BACKUP_FILE

if [ -s $BACKUP_FILE ]; then
    SIZE=$(du -h $BACKUP_FILE | cut -f1)
    echo "$(date): ✅ Backup OK - $SIZE - $BACKUP_FILE" >> /home/backups/backup.log
    find $BACKUP_DIR -name "*.sql.gz" -mtime +$DAYS_TO_KEEP -delete
else
    echo "$(date): ❌ ERROR en backup" >> /home/backups/backup.log
    rm -f $BACKUP_FILE
fi
EOF

# Dar permisos
chmod +x /home/backups/backup_aserradero.sh

echo "📦 Ejecutando primer backup de prueba..."
/home/backups/backup_aserradero.sh

# Verificar backup
echo ""
echo "📁 Backups creados:"
ls -lh /home/backups/aserradero/

# Configurar CRON (3:00 AM todos los días)
(crontab -l 2>/dev/null | grep -v backup_aserradero; echo "0 3 * * * /home/backups/backup_aserradero.sh") | crontab -

echo ""
echo "⏰ CRON configurado:"
crontab -l | grep backup

echo ""
echo "✅ ¡Instalación completada!"
echo ""
echo "📋 Resumen:"
echo "   - Backup automático: Todos los días a las 3:00 AM"
echo "   - Ubicación: /home/backups/aserradero/"
echo "   - Retención: 30 días"
echo "   - Log: /home/backups/backup.log"
echo ""
echo "🔧 Comandos útiles:"
echo "   Ver backups:    ls -lh /home/backups/aserradero/"
echo "   Ver log:        cat /home/backups/backup.log"
echo "   Backup manual:  /home/backups/backup_aserradero.sh"

