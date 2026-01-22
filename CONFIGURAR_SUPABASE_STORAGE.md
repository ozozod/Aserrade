# Configurar Supabase Storage para Imágenes de Remitos

## Pasos para Configurar el Almacenamiento

### 1. Crear el Bucket en Supabase

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. En el menú lateral, haz clic en **Storage**
3. Haz clic en **New bucket**
4. Configura el bucket:
   - **Name**: `remitos-fotos`
   - **Public bucket**: ✅ **SÍ** (marcado)
   - Haz clic en **Create bucket**

### 2. Configurar Políticas de Seguridad (RLS)

1. En Storage, haz clic en el bucket `remitos-fotos`
2. Ve a la pestaña **Policies**
3. Haz clic en **New Policy** y selecciona **For full customization**

**Política 1: Lectura Pública**
- **Policy name**: `Allow public read`
- **Allowed operation**: `SELECT`
- **Policy definition**: 
```sql
true
```
- Haz clic en **Save**

**Política 2: Subida Permitida**
- **Policy name**: `Allow authenticated upload`
- **Allowed operation**: `INSERT`
- **Policy definition**:
```sql
bucket_id = 'remitos-fotos'
```
- Haz clic en **Save**

**Política 3: Actualización Permitida**
- **Policy name**: `Allow authenticated update`
- **Allowed operation**: `UPDATE`
- **Policy definition**:
```sql
bucket_id = 'remitos-fotos'
```
- Haz clic en **Save**

**Política 4: Eliminación Permitida**
- **Policy name**: `Allow authenticated delete`
- **Allowed operation**: `DELETE`
- **Policy definition**:
```sql
bucket_id = 'remitos-fotos'
```
- Haz clic en **Save**

### 3. Verificar la Configuración

Una vez configurado, las imágenes se subirán automáticamente cuando:
1. Creas un nuevo remito con imagen
2. Editas un remito y cambias la imagen

### Características de la Compresión

- **Tamaño máximo**: 1600px de ancho
- **Formato**: JPG
- **Calidad**: 70%
- **Tamaño estimado por imagen**: 100-300 KB
- **1000 remitos con fotos**: ~100-300 MB (dentro del límite de 500MB)

### Ventajas

✅ **Compartido**: Todas las 4 PCs pueden ver las imágenes
✅ **Económico**: Compresión agresiva para ahorrar espacio
✅ **Rápido**: Acceso directo mediante URL pública
✅ **Seguro**: Almacenado en la nube de Supabase

---

*Nota: Asegúrate de que el bucket esté configurado como público para que las URLs funcionen correctamente.*

