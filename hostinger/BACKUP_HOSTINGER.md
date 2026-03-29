# 🔒 Sistema de Backup Automático - Hostinger

> **AVISO (2026):** no commitees contraseñas reales en documentación. Usá gestor de secretos / variables de entorno.

## 📋 Resumen
Sistema de backup automático para la base de datos MySQL en el VPS de Hostinger.
- **Frecuencia**: Todos los días a las 3:00 AM (hora del servidor)
- **Retención**: 30 días de backups
- **Ubicación**: `/home/backups/aserradero/`

---

## 🚀 Instalación (una sola vez)

### 1. Conectar al VPS por SSH
```bash
ssh root@31.97.246.42
```
Contraseña: *(configuración del servidor / no pegar secretos en el repo)*

### 2. Crear directorio de backups
```bash
mkdir -p /home/backups/aserradero
```

### 3. Crear el script de backup
```bash
nano /home/backups/backup_aserradero.sh
```

Pegar este contenido:
```bash
#!/bin/bash
# BACKUP AUTOMÁTICO - ASERRADERO

DB_NAME="aserradero_db"
DB_USER="aserradero_user"
DB_PASS="Aserradero2025#"
BACKUP_DIR="/home/backups/aserradero"
DAYS_TO_KEEP=30

mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/aserradero_backup_$TIMESTAMP.sql.gz"

echo "$(date): Iniciando backup..." >> /home/backups/backup.log

mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_FILE

if [ $? -eq 0 ]; then
    SIZE=$(du -h $BACKUP_FILE | cut -f1)
    echo "$(date): Backup OK - $SIZE" >> /home/backups/backup.log
    find $BACKUP_DIR -name "*.sql.gz" -mtime +$DAYS_TO_KEEP -delete
else
    echo "$(date): ERROR en backup" >> /home/backups/backup.log
fi
```

Guardar: `Ctrl+O`, Enter, `Ctrl+X`

### 4. Dar permisos de ejecución
```bash
chmod +x /home/backups/backup_aserradero.sh
```

### 5. Probar el script
```bash
/home/backups/backup_aserradero.sh
```

### 6. Verificar que se creó el backup
```bash
ls -la /home/backups/aserradero/
```

### 7. Configurar CRON para backup automático
```bash
crontab -e
```

Agregar esta línea al final (backup a las 3:00 AM todos los días):
```
0 3 * * * /home/backups/backup_aserradero.sh
```

Guardar y salir.

### 8. Verificar que el cron está activo
```bash
crontab -l
```

---

## 📁 Comandos Útiles

### Ver backups existentes
```bash
ls -lh /home/backups/aserradero/
```

### Ver log de backups
```bash
cat /home/backups/backup.log
```

### Hacer backup manual
```bash
/home/backups/backup_aserradero.sh
```

### Restaurar un backup
```bash
# Descomprimir
gunzip /home/backups/aserradero/aserradero_backup_FECHA.sql.gz

# Restaurar
mysql -u aserradero_user -p aserradero_db < /home/backups/aserradero/aserradero_backup_FECHA.sql
```

### Ver espacio en disco
```bash
df -h
```

---

## 🌐 Google Drive (Opcional)

Si querés subir los backups a Google Drive automáticamente:

### 1. Instalar rclone
```bash
curl https://rclone.org/install.sh | sudo bash
```

### 2. Configurar Google Drive
```bash
rclone config
```
- Elegir `n` (new remote)
- Nombre: `gdrive`
- Tipo: `drive` (Google Drive)
- Seguir las instrucciones para autorizar

### 3. Modificar el script de backup
Agregar al final del script:
```bash
# Subir a Google Drive
rclone copy $BACKUP_FILE gdrive:Backups/Aserradero/
```

---

## 📊 Información del Sistema

- **Servidor**: VPS Ubuntu - Hostinger
- **IP**: 31.97.246.42
- **Base de datos**: aserradero_db
- **Usuario DB**: aserradero_user
- **Directorio backups**: /home/backups/aserradero/
- **Horario backup**: 3:00 AM (hora del servidor)
- **Retención**: 30 días

---

## ⚠️ Notas Importantes

1. **Las fotos de remitos** en la app actual suelen estar en MySQL como `data:image/...;base64,...` (columna `remitos.foto_path`). Un `mysqldump` **sí** incluye esos valores (el `.sql` puede pesar mucho).
2. Si todavía existen registros antiguos con URLs externas, son casos puntuales (no el modelo actual).
3. El espacio en disco del VPS es limitado, por eso se eliminan backups de más de 30 días

---

*Última actualización: Marzo 2026*

