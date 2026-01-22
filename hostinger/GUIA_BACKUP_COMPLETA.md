# 🔒 GUÍA COMPLETA DE BACKUP - ASERRADERO

## 📋 Información del Sistema

| Parámetro | Valor |
|-----------|-------|
| **Servidor** | VPS Ubuntu - Hostinger |
| **IP** | 31.97.246.42 |
| **Usuario SSH** | root |
| **Contraseña SSH** | 123Pitufo244955# |
| **Base de datos** | aserradero_db |
| **Usuario DB** | aserradero_user |
| **Contraseña DB** | Aserradero2025# |
| **Hora de backup** | 11:00 PM Argentina (2:00 AM servidor) |
| **Retención local** | 90 días |
| **Retención Google Drive** | Ilimitada |

---

## 🔌 CONECTAR AL SERVIDOR

### Desde Windows (CMD o PowerShell):
```bash
ssh root@31.97.246.42
```
Contraseña: `123Pitufo244955#`

### Desde Mac/Linux:
```bash
ssh root@31.97.246.42
```

---

## 📁 VER BACKUPS EXISTENTES

### Ver backups en el servidor:
```bash
ls -lh /home/backups/aserradero/
```

### Ver backups en Google Drive:
```bash
rclone ls gdrive:Backups/Aserradero/
```

### Ver log de backups:
```bash
cat /home/backups/backup.log
```

### Ver últimas líneas del log:
```bash
tail -20 /home/backups/backup.log
```

---

## 🔄 HACER BACKUP MANUAL

### Ejecutar backup ahora:
```bash
/home/backups/backup_aserradero.sh
```

### Verificar que se creó:
```bash
ls -lh /home/backups/aserradero/
rclone ls gdrive:Backups/Aserradero/
```

---

## ♻️ RESTAURAR BACKUP DESDE SERVIDOR LOCAL

### Paso 1: Ver backups disponibles
```bash
ls -lh /home/backups/aserradero/
```

### Paso 2: Restaurar (cambiar FECHA por la fecha del backup)
```bash
# Descomprimir (mantener original con -k)
gunzip -k /home/backups/aserradero/aserradero_backup_FECHA.sql.gz

# Restaurar
mysql -u aserradero_user -p'Aserradero2025#' aserradero_db < /home/backups/aserradero/aserradero_backup_FECHA.sql

# Limpiar archivo descomprimido
rm /home/backups/aserradero/aserradero_backup_FECHA.sql

echo "✅ Restaurado!"
```

### Ejemplo con fecha real:
```bash
gunzip -k /home/backups/aserradero/aserradero_backup_20251205_022104.sql.gz
mysql -u aserradero_user -p'Aserradero2025#' aserradero_db < /home/backups/aserradero/aserradero_backup_20251205_022104.sql
rm /home/backups/aserradero/aserradero_backup_20251205_022104.sql
```

---

## ☁️ RESTAURAR BACKUP DESDE GOOGLE DRIVE

### Paso 1: Ver backups en Google Drive
```bash
rclone ls gdrive:Backups/Aserradero/
```

### Paso 2: Descargar el backup (cambiar FECHA)
```bash
rclone copy gdrive:Backups/Aserradero/aserradero_backup_FECHA.sql.gz /tmp/
```

### Paso 3: Descomprimir
```bash
gunzip /tmp/aserradero_backup_FECHA.sql.gz
```

### Paso 4: Restaurar
```bash
mysql -u aserradero_user -p'Aserradero2025#' aserradero_db < /tmp/aserradero_backup_FECHA.sql
```

### Paso 5: Limpiar
```bash
rm /tmp/aserradero_backup_FECHA.sql
```

### Ejemplo completo con fecha real:
```bash
rclone copy gdrive:Backups/Aserradero/aserradero_backup_20251205_022104.sql.gz /tmp/
gunzip /tmp/aserradero_backup_20251205_022104.sql.gz
mysql -u aserradero_user -p'Aserradero2025#' aserradero_db < /tmp/aserradero_backup_20251205_022104.sql
rm /tmp/aserradero_backup_20251205_022104.sql
echo "✅ Restaurado desde Google Drive!"
```

---

## 🗑️ BORRAR TODOS LOS DATOS (¡CUIDADO!)

### Vaciar todas las tablas:
```bash
mysql -u aserradero_user -p'Aserradero2025#' aserradero_db -e "
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE pagos;
TRUNCATE TABLE remito_articulos;
TRUNCATE TABLE remitos;
TRUNCATE TABLE articulos;
TRUNCATE TABLE clientes;
SET FOREIGN_KEY_CHECKS = 1;
SELECT '⚠️ DATOS BORRADOS!' as resultado;
"
```

---

## 📊 VERIFICAR DATOS

### Contar registros en cada tabla:
```bash
mysql -u aserradero_user -p'Aserradero2025#' aserradero_db -e "
SELECT 'clientes' as tabla, COUNT(*) as registros FROM clientes
UNION SELECT 'articulos', COUNT(*) FROM articulos
UNION SELECT 'remitos', COUNT(*) FROM remitos
UNION SELECT 'remito_articulos', COUNT(*) FROM remito_articulos
UNION SELECT 'pagos', COUNT(*) FROM pagos;
"
```

### Ver últimos clientes:
```bash
mysql -u aserradero_user -p'Aserradero2025#' aserradero_db -e "SELECT * FROM clientes ORDER BY id DESC LIMIT 5;"
```

### Ver últimos remitos:
```bash
mysql -u aserradero_user -p'Aserradero2025#' aserradero_db -e "SELECT id, cliente_id, fecha, numero, estado_pago FROM remitos ORDER BY id DESC LIMIT 5;"
```

---

## ⏰ CONFIGURACIÓN DEL CRON

### Ver cron actual:
```bash
crontab -l
```

### Cambiar hora del backup:
```bash
# Editar crontab
crontab -e

# Formato: MINUTO HORA * * * comando
# 0 2 = 2:00 AM servidor = 11:00 PM Argentina
# 0 5 = 5:00 AM servidor = 2:00 AM Argentina
# 0 10 = 10:00 AM servidor = 7:00 AM Argentina
```

### Tabla de conversión de horas:

| Argentina | Servidor (UTC) |
|-----------|----------------|
| 00:00 (medianoche) | 03:00 |
| 06:00 | 09:00 |
| 12:00 | 15:00 |
| 18:00 | 21:00 |
| 23:00 (11 PM) | 02:00 |

---

## 🔧 MANTENIMIENTO

### Ver espacio en disco:
```bash
df -h
```

### Ver tamaño de backups:
```bash
du -sh /home/backups/aserradero/
```

### Borrar backups locales antiguos manualmente:
```bash
# Borrar backups de más de 30 días
find /home/backups/aserradero/ -name "*.sql.gz" -mtime +30 -delete
```

### Reiniciar MySQL:
```bash
systemctl restart mysql
```

### Ver estado de MySQL:
```bash
systemctl status mysql
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Si el backup falla:
```bash
# Ver log de errores
cat /home/backups/backup.log

# Probar conexión a MySQL
mysql -u aserradero_user -p'Aserradero2025#' -e "SELECT 1;"

# Probar conexión a Google Drive
rclone lsd gdrive:
```

### Si Google Drive no funciona:
```bash
# Reconfigurar
rclone config

# Probar subida manual
echo "test" > /tmp/test.txt
rclone copy /tmp/test.txt gdrive:Backups/
rclone ls gdrive:Backups/
```

### Si no puedo conectar por SSH:
1. Verificar que el VPS esté encendido en hPanel de Hostinger
2. Verificar la IP: 31.97.246.42
3. Verificar que el firewall permita SSH (puerto 22)

---

## 📞 INFORMACIÓN DE CONTACTO

- **Hostinger Panel**: https://hpanel.hostinger.com
- **IP del VPS**: 31.97.246.42
- **Puerto MySQL**: 3306
- **Puerto SSH**: 22

---

*Última actualización: Diciembre 2025*

