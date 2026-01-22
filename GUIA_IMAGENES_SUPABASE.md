# Guía: Almacenamiento de Imágenes en Supabase Storage

## Problema
- 4 PCs necesitan compartir imágenes de remitos
- Solo 500MB gratis en Supabase
- Las imágenes locales no se comparten entre PCs

## Solución: Supabase Storage con Compresión Agresiva

### Ventajas:
1. ✅ **Compartido**: Todas las PCs pueden ver las imágenes
2. ✅ **Económico**: Imágenes comprimidas ocupan poco espacio
3. ✅ **Integrado**: Ya usas Supabase

### Tamaño Estimado:
- **Imagen original**: 2-5 MB
- **Comprimida** (1920px, 80% JPG): **100-300 KB**
- **1000 remitos con fotos**: ~100-300 MB
- **Espacio disponible**: ~200-400 MB para base de datos

### Configuración Necesaria:

1. **Crear bucket en Supabase**:
   - Nombre: `remitos-fotos`
   - Público: ✅ Sí (para acceder desde las PCs)

2. **Políticas RLS** (Row Level Security):
   - Permitir lectura pública
   - Permitir escritura solo con autenticación (o configurar service key)

### Implementación:
- Compresión automática a 1920px máximo
- Formato JPG con calidad 80%
- Tamaño final: ~100-300 KB por imagen

