/**
 * DEPRECADO (2026): este script antes descargaba imágenes desde un storage cloud externo.
 *
 * La app guarda fotos como data URL/base64 en MySQL.
 *
 * Para backup SQL desde la app (Electron): usar la función expuesta vía IPC
 * `mysql:exportBackupSQL` (ver `database/mysqlService.js`).
 *
 * Para backup en servidor/CLI: usar `mysqldump` + copia de adjuntos si aplica.
 */

// eslint-disable-next-line no-console
console.log(
  [
    'Este script está deprecado: ya no hay bucket de storage cloud externo.',
    'Usá backup SQL desde la app o mysqldump en el servidor.',
    'Archivo: scripts/backup-completo-con-imagenes.js'
  ].join('\n')
);

process.exitCode = 0;
