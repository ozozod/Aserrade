# 🔐 Configuración de Credenciales

## Importante: Seguridad de Credenciales

Las credenciales de Supabase ahora se cargan desde un archivo `config.json` externo que **NO se incluye en el build** de la aplicación. Esto significa que las credenciales no estarán visibles en el código compilado.

## Configuración Inicial

### 1. Crear el archivo `config.json`

Copia el archivo `config.json.example` y renómbralo a `config.json`:

```bash
cp config.json.example config.json
```

O crea manualmente `config.json` en la raíz del proyecto con este contenido:

```json
{
  "supabase": {
    "url": "https://tu-proyecto.supabase.co",
    "anonKey": "tu-api-key-aqui"
  },
  "errorReporting": {
    "url": "https://tu-proyecto-error.supabase.co",
    "anonKey": "tu-api-key-error-aqui",
    "enabled": true
  }
}
```

### 2. Agregar tus credenciales

Reemplaza los valores con tus credenciales reales de Supabase:

- **supabase.url**: URL de tu proyecto principal de Supabase
- **supabase.anonKey**: API Key anónima de tu proyecto principal
- **errorReporting.url**: URL de tu proyecto de Supabase para reporte de errores
- **errorReporting.anonKey**: API Key anónima del proyecto de errores
- **errorReporting.enabled**: `true` para habilitar reporte de errores, `false` para deshabilitar

### 3. Verificar que está en .gitignore

El archivo `config.json` ya está en `.gitignore`, por lo que **NO se subirá a Git**. Esto es correcto y seguro.

## Desarrollo

En desarrollo, si no existe `config.json`, la app usará valores por defecto (solo para desarrollo local).

## Producción

**IMPORTANTE**: Para el instalador final, debes:

1. Crear el archivo `config.json` con las credenciales de producción
2. El archivo `config.json` debe estar en la misma carpeta que `main.js` cuando se ejecute la app instalada
3. El archivo `config.json` **NO se incluirá automáticamente en el build** (está excluido en `package.json`)

### Opción A: Incluir config.json manualmente después del build

Después de generar el instalador, copia `config.json` a la carpeta donde se instaló la app.

### Opción B: Modificar el build para incluir config.json (no recomendado)

Si quieres que `config.json` se incluya en el instalador (menos seguro), puedes:

1. Editar `package.json` y quitar `"!config.json"` de la sección `files`
2. **ADVERTENCIA**: Esto incluirá las credenciales en el instalador, haciéndolas visibles

## Verificación

Para verificar que las credenciales se están cargando correctamente:

1. Inicia la app en desarrollo: `npm run dev`
2. Abre la consola (si DevTools está habilitado)
3. Deberías ver: `✓ Configuración cargada desde config.json`

## Seguridad

- ✅ `config.json` está en `.gitignore` (no se sube a Git)
- ✅ `config.json` está excluido del build por defecto
- ✅ Las credenciales se cargan desde el proceso principal de Electron (más seguro)
- ⚠️ Si incluyes `config.json` en el instalador, las credenciales estarán visibles en el código compilado

## Solución de Problemas

### Error: "config.json no encontrado"

**En desarrollo**: La app usará valores por defecto.

**En producción**: Debes crear `config.json` en la carpeta de instalación.

### Error: "No se pudieron cargar las credenciales de Supabase"

1. Verifica que `config.json` existe
2. Verifica que el formato JSON es correcto
3. Verifica que las credenciales son válidas



