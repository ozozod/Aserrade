# 💾 Sistema de Backups Diarios Automáticos

## 📋 Descripción

Sistema completo de backups diarios para la base de datos de Supabase. Incluye:
- ✅ Generación automática de backups SQL
- ✅ Almacenamiento en Supabase Storage
- ✅ Historial de backups
- ✅ Interfaz de gestión desde la aplicación
- ✅ Scripts para automatización

## 🚀 Instalación y Configuración

### Paso 1: Ejecutar Scripts SQL en Supabase

1. Ve al panel de Supabase → **SQL Editor**
2. Ejecuta el archivo `supabase/sistema_backup_diario.sql`
3. Esto creará:
   - Tabla `backups_historial`
   - Funciones SQL para generar y gestionar backups

### Paso 2: Crear Bucket de Storage

1. Ve a Supabase → **Storage**
2. Crea un nuevo bucket llamado: `backups-database`
3. Configuración recomendada:
   - **Público**: No (privado)
   - **Tamaño máximo de archivo**: 100 MB
   - **Tipos MIME permitidos**: `application/sql`, `text/plain`

### Paso 3: Configurar Variables de Entorno

Si vas a usar el script automático, agrega a tu `.env`:

```env
# Ya deberías tener estas
REACT_APP_SUPABASE_URL=tu_url_de_supabase
REACT_APP_SUPABASE_ANON_KEY=tu_anon_key

# Opcionales para el script automático
BACKUP_COPIA_LOCAL=true                    # Guardar copia local además de Storage
BACKUP_CARPETA_LOCAL=./backups             # Carpeta para copias locales
BACKUP_WEBHOOK_ERROR=https://...           # URL para notificar errores (opcional)
```

### Paso 4: Instalar Dependencias para Scripts

```bash
npm install dotenv @supabase/supabase-js
```

## 💾 Dónde se Guardan los Backups

**IMPORTANTE**: Si tu plan de Supabase tiene poco espacio (ej: 50MB), el sistema está configurado para:

1. **Descarga Automática** (por defecto): El backup se descarga automáticamente a tu carpeta de Descargas
2. **Supabase Storage** (opcional): Solo si marcas la opción y hay espacio disponible

### Recomendaciones de Almacenamiento

- ✅ **Google Drive** (15GB gratis): Sube los backups descargados manualmente
- ✅ **USB/Disco Externo**: Para backups físicos
- ✅ **OneDrive/Dropbox**: Alternativas en la nube
- ✅ **Email**: Para backups pequeños (envíate el archivo .sql)

### Organización Recomendada

Crea una carpeta en Google Drive:
```
Backups Aserradero/
  ├── 2025/
  │   ├── 11/
  │   │   ├── backup_2025-11-27_143022.sql
  │   │   └── backup_2025-11-28_143022.sql
  │   └── 12/
  └── 2026/
```

## 📅 Configurar Backup Automático Diario

Tienes varias opciones para ejecutar backups automáticamente:

### Opción 1: Servicio Online Gratis (Recomendado para empezar)

**cron-job.org** (gratis):
1. Regístrate en https://cron-job.org
2. Crea un nuevo cron job:
   - **URL**: `https://tu-dominio.com/api/backup` (si tienes API)
   - O usa un webhook que ejecute el script
3. **Frecuencia**: Diario a las 2:00 AM
4. **Método**: GET o POST

**Alternativas gratuitas**:
- EasyCron
- UptimeRobot (con webhook)

### Opción 2: Task Scheduler (Windows)

1. Abre **Programador de tareas** (Task Scheduler)
2. Crear tarea básica:
   - **Nombre**: Backup Diario Aserradero
   - **Desencadenador**: Diario a las 2:00 AM
   - **Acción**: Iniciar programa
   - **Programa**: `node.exe`
   - **Argumentos**: `C:\ruta\completa\al\script\ejecutar-backup-diario.js`
   - **Iniciar en**: Carpeta del proyecto

### Opción 3: Cron (Linux/Mac)

Edita el crontab:
```bash
crontab -e
```

Agrega esta línea (backup diario a las 2:00 AM):
```cron
0 2 * * * cd /ruta/al/proyecto && node scripts/ejecutar-backup-diario.js >> logs/backup.log 2>&1
```

### Opción 4: Supabase Edge Functions (Avanzado)

Puedes crear una Edge Function en Supabase que se ejecute con un cron:

1. Crea una Edge Function en Supabase
2. Configura un cron job en Supabase Dashboard
3. La función ejecuta el backup automáticamente

## 🖥️ Usar desde la Aplicación

### Agregar Pestaña de Backups

En tu componente principal (App.js o similar), agrega:

```javascript
import Backups from './components/Backups';

// En el render, agrega una nueva pestaña:
<Tab label="💾 Backups">
  <Backups theme={theme} />
</Tab>
```

### Funcionalidades Disponibles

1. **Generar Backup Manual**: Clic en "Generar Backup Ahora"
2. **Ver Historial**: Lista de todos los backups realizados
3. **Descargar Backup**: Descargar cualquier backup como archivo .sql
4. **Estadísticas**: Ver total de backups, tamaño, último backup
5. **Limpiar Antiguos**: Eliminar backups más antiguos de X días

## 🔄 Restaurar un Backup

### Método 1: Desde la Aplicación

1. Ve a la pestaña **Backups**
2. Clic en **Descargar** del backup que quieres restaurar
3. Abre el archivo .sql descargado
4. Ve a Supabase → **SQL Editor**
5. Pega el contenido completo
6. **Revisa cuidadosamente** (especialmente las líneas DELETE)
7. Ejecuta el script

### Método 2: Desde Supabase Storage

1. Ve a Supabase → **Storage** → `backups-database`
2. Navega a la carpeta del año/mes
3. Descarga el archivo .sql
4. Sigue los pasos 3-7 del Método 1

## ⚠️ Consideraciones Importantes

### Seguridad

- ✅ Los backups se guardan en Supabase Storage (privado)
- ✅ Solo usuarios autorizados pueden acceder
- ⚠️ Los backups contienen TODOS los datos sensibles
- ⚠️ No compartas los archivos .sql con nadie

### Tamaño de Backups

- **Estimado**: 1-10 MB por backup (depende de la cantidad de datos)
- **Límite Supabase Storage**: Depende de tu plan
  - Plan Free: 1 GB
  - Plan Pro: 100 GB
- **Recomendación**: Limpiar backups antiguos cada 90 días

### Frecuencia Recomendada

- **Backup diario**: Suficiente para la mayoría de casos
- **Backup antes de cambios importantes**: Siempre hacer backup manual
- **Retención**: Mantener últimos 30-90 días

## 📊 Monitoreo

### Verificar que los Backups Funcionan

1. **Desde la App**: Ve a Backups → Verifica que aparezcan backups diarios
2. **Desde Supabase Storage**: Verifica que se creen archivos diariamente
3. **Logs del Script**: Si usas script automático, revisa los logs

### Alertas de Errores

Si configuraste `BACKUP_WEBHOOK_ERROR`, recibirás notificaciones cuando falle un backup.

## 🛠️ Solución de Problemas

### Error: "Bucket no existe"

**Solución**: Crea el bucket `backups-database` manualmente en Supabase Storage

### Error: "Función no encontrada"

**Solución**: Ejecuta el script SQL `sistema_backup_diario.sql` en Supabase

### Error: "Permisos insuficientes"

**Solución**: Verifica que tu `SUPABASE_ANON_KEY` tenga permisos para:
- Ejecutar funciones RPC
- Escribir en Storage
- Leer/Escribir en tabla `backups_historial`

### Los Backups no se Generan Automáticamente

**Verifica**:
1. Que el cron job/tarea programada esté activa
2. Que el script tenga permisos de ejecución
3. Que las variables de entorno estén configuradas
4. Revisa los logs del script

## 💰 Costos

### Supabase Storage

- **Plan Free**: 1 GB gratis (suficiente para ~100-1000 backups)
- **Plan Pro**: 100 GB incluidos
- **Precio adicional**: $0.021 por GB/mes si excedes

### Estimación de Costos

Con backups diarios de ~5 MB:
- **30 días**: ~150 MB
- **90 días**: ~450 MB
- **1 año**: ~1.8 GB

**Conclusión**: Con el plan Free o Pro, los backups no deberían generar costos adicionales.

## 📝 Checklist de Implementación

- [ ] Ejecutar `sistema_backup_diario.sql` en Supabase
- [ ] Crear bucket `backups-database` en Storage
- [ ] Agregar componente Backups a la aplicación
- [ ] Probar generar backup manual
- [ ] Configurar backup automático (cron/task scheduler)
- [ ] Verificar que se generen backups diarios
- [ ] Probar descargar y restaurar un backup
- [ ] Configurar limpieza de backups antiguos (opcional)

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs de la aplicación
2. Revisa los logs del script automático
3. Verifica la configuración en Supabase Dashboard
4. Prueba generar un backup manual desde la app

---

**Última actualización**: Noviembre 2025

