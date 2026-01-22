# Migración a Arquitectura Cliente-Servidor

## Situación Actual
- Aplicación Electron con SQLite local
- Funciona offline
- Base de datos local en cada PC

## Nueva Situación
- 4 PCs usando la aplicación simultáneamente
- Hosting contratado en Hostinger
- Necesita base de datos centralizada

## Opciones de Arquitectura

### Opción 1: Backend API + Electron (Recomendada)
**Ventajas:**
- Mantiene la app de escritorio
- Base de datos centralizada
- Sincronización automática entre PCs
- Funciona online

**Estructura:**
```
[PC 1] ──┐
[PC 2] ──┤
[PC 3] ──┼──> [API Backend en Hostinger] ──> [Base de Datos MySQL/PostgreSQL]
[PC 4] ──┘
```

**Tecnologías:**
- Backend: Node.js + Express
- Base de datos: MySQL o PostgreSQL
- Cliente: Electron (modificado para usar API)

### Opción 2: Aplicación Web Pura
**Ventajas:**
- Más simple de mantener
- No requiere instalación en cada PC
- Acceso desde cualquier navegador
- Actualizaciones automáticas

**Estructura:**
```
[PC 1] ──┐
[PC 2] ──┤
[PC 3] ──┼──> [Aplicación Web en Hostinger] ──> [Base de Datos]
[PC 4] ──┘
```

**Tecnologías:**
- Frontend: React (ya lo tenemos)
- Backend: Node.js + Express
- Base de datos: MySQL o PostgreSQL

## Información Necesaria de Hostinger

Para proceder necesitamos:

1. **Tipo de Hosting:**
   - [ ] Shared Hosting
   - [ ] VPS
   - [ ] Cloud Hosting
   - [ ] Otro: _______________

2. **Acceso a Base de Datos:**
   - [ ] MySQL disponible
   - [ ] PostgreSQL disponible
   - [ ] phpMyAdmin disponible
   - [ ] Credenciales de acceso

3. **Acceso al Servidor:**
   - [ ] SSH disponible
   - [ ] Solo panel de control (cPanel/Plesk)
   - [ ] Node.js disponible en el servidor

4. **Dominio:**
   - ¿Tienen dominio configurado?
   - URL: _______________

5. **Preferencia:**
   - [ ] Mantener Electron (app de escritorio)
   - [ ] Cambiar a aplicación web (navegador)
   - [ ] No tengo preferencia

## Pasos de Migración

### Si eligen Opción 1 (Backend API + Electron):

1. **Crear Backend API:**
   - Servidor Express en Hostinger
   - Endpoints REST para todas las operaciones
   - Autenticación (si es necesaria)

2. **Configurar Base de Datos:**
   - Crear base de datos MySQL/PostgreSQL
   - Migrar esquema de SQLite a MySQL
   - Configurar conexión

3. **Modificar Electron:**
   - Cambiar de SQLite local a llamadas API
   - Manejo de conexión/desconexión
   - Sincronización

### Si eligen Opción 2 (Aplicación Web):

1. **Preparar Build de React:**
   - Compilar aplicación React
   - Subir a Hostinger

2. **Crear Backend API:**
   - Servidor Express
   - Endpoints REST

3. **Configurar Base de Datos:**
   - MySQL/PostgreSQL
   - Migrar datos

## Preguntas Importantes

1. ¿Las 4 PCs están en la misma red local o en diferentes ubicaciones?
2. ¿Necesitan trabajar offline o siempre online?
3. ¿Prefieren app de escritorio o web?
4. ¿Tienen experiencia con hosting/servidores?

## Próximos Pasos

Una vez que tengamos la información de Hostinger, procederemos con:
1. Diseño de la arquitectura específica
2. Creación del backend API
3. Migración de la base de datos
4. Modificación del cliente (Electron o Web)


