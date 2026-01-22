/**
 * Script para publicar un nuevo release en GitHub
 * 
 * USO:
 *   node scripts/publish-release.js
 * 
 * REQUISITOS:
 *   - GitHub Token en variable de entorno GH_TOKEN
 *   - Archivos de build en carpeta dist/
 *   - Versión actualizada en package.json
 *   - Changelog actualizado en CHANGELOG.md
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
  process.exit(1);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Leer package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const version = packageJson.version;

info(`Preparando release v${version}...`);

// Verificar que existe GH_TOKEN
if (!process.env.GH_TOKEN) {
  error('No se encontró GH_TOKEN en las variables de entorno');
}

// Verificar que existen los archivos de build
const distPath = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distPath)) {
  error('No se encontró la carpeta dist/. Ejecuta primero: npm run build:win');
}

const setupFile = path.join(distPath, `Aserradero App-${version}-Setup.exe`);
const latestYml = path.join(distPath, 'latest.yml');

if (!fs.existsSync(setupFile)) {
  error(`No se encontró ${setupFile}`);
}

if (!fs.existsSync(latestYml)) {
  error('No se encontró latest.yml');
}

success('Archivos de build encontrados');

// Leer el CHANGELOG para las notas del release
const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
let releaseNotes = 'Ver CHANGELOG.md para más detalles';

if (fs.existsSync(changelogPath)) {
  const changelog = fs.readFileSync(changelogPath, 'utf8');
  
  // Extraer la sección de la versión actual
  const versionRegex = new RegExp(`## \\[Versión ${version.replace(/\./g, '\\.')}\\].*?(?=\\n## |$)`, 's');
  const match = changelog.match(versionRegex);
  
  if (match) {
    releaseNotes = match[0].trim();
    success('Notas del release extraídas del CHANGELOG');
  } else {
    warning('No se encontró la versión actual en el CHANGELOG');
  }
}

// Crear tag si no existe
info('Verificando tag de Git...');
try {
  execSync(`git tag v${version}`, { stdio: 'ignore' });
  execSync(`git push origin v${version}`, { stdio: 'inherit' });
  success(`Tag v${version} creado y publicado`);
} catch (err) {
  warning('El tag ya existe o no se pudo crear');
}

// Crear release con GitHub CLI
info('Creando release en GitHub...');

try {
  // Guardar notas en archivo temporal
  const notesFile = path.join(distPath, 'release-notes.md');
  fs.writeFileSync(notesFile, releaseNotes);

  // Crear release
  const cmd = `gh release create v${version} ` +
    `--title "v${version} - Actualización" ` +
    `--notes-file "${notesFile}" ` +
    `"${setupFile}" ` +
    `"${latestYml}"`;

  execSync(cmd, { stdio: 'inherit' });
  
  // Limpiar archivo temporal
  fs.unlinkSync(notesFile);
  
  success(`Release v${version} publicado exitosamente!`);
  info('Los usuarios recibirán la actualización automáticamente');
} catch (err) {
  error('Error al crear el release. Asegúrate de tener GitHub CLI instalado y configurado');
}
