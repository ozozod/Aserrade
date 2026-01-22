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

// Verificar que gh está disponible o GH_TOKEN está configurado
let ghAvailable = false;
try {
  // Intentar encontrar gh en la ruta estándar de Windows
  const { execSync } = require('child_process');
  const os = require('os');
  const platform = os.platform();
  
  if (platform === 'win32') {
    // Buscar gh en la ruta estándar de Windows
    const ghPath = 'C:\\Program Files\\GitHub CLI\\gh.exe';
    if (fs.existsSync(ghPath)) {
      ghAvailable = true;
      // Sobrescribir el execSync para usar la ruta completa
      const originalExecSync = execSync;
      global.ghPath = ghPath;
    } else {
      // Intentar ejecutar gh directamente (puede estar en PATH después de reiniciar)
      try {
        execSync('gh --version', { stdio: 'ignore' });
        ghAvailable = true;
      } catch (e) {
        ghAvailable = false;
      }
    }
  } else {
    try {
      execSync('gh --version', { stdio: 'ignore' });
      ghAvailable = true;
    } catch (e) {
      ghAvailable = false;
    }
  }
} catch (e) {
  ghAvailable = false;
}

if (!ghAvailable && !process.env.GH_TOKEN) {
  warning('gh CLI no está disponible en PATH. Intentando continuar...');
  warning('Si falla, reinicia PowerShell o configura GH_TOKEN como variable de entorno');
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

// Crear tag si no existe (opcional, gh release create puede crear el tag)
info('Verificando tag de Git...');
try {
  // Intentar crear el tag localmente (puede fallar si ya existe, no importa)
  execSync(`git tag v${version}`, { stdio: 'ignore' });
  info(`Tag v${version} creado localmente`);
} catch (e) {
  info('El tag ya existe localmente');
}
// No hacemos push del tag, gh release create lo manejará

// Crear release con GitHub CLI
info('Creando release en GitHub...');

try {
  // Guardar notas en archivo temporal
  const notesFile = path.join(distPath, 'release-notes.md');
  fs.writeFileSync(notesFile, releaseNotes);

  // Crear release
  const ghCommand = global.ghPath || 'gh';
  
  // Configurar entorno con GH_TOKEN si está disponible
  const env = { ...process.env };
  if (process.env.GH_TOKEN) {
    env.GH_TOKEN = process.env.GH_TOKEN;
  }
  
  // Usar --target para especificar la rama (main) en caso de que el tag no esté en el remoto
  const cmd = `"${ghCommand}" release create v${version} ` +
    `--title "v${version} - Actualización" ` +
    `--notes-file "${notesFile}" ` +
    `--target main ` +
    `"${setupFile}" ` +
    `"${latestYml}"`;

  execSync(cmd, { stdio: 'inherit', shell: true, env: env });
  
  // Limpiar archivo temporal
  fs.unlinkSync(notesFile);
  
  success(`Release v${version} publicado exitosamente!`);
  info('Los usuarios recibirán la actualización automáticamente');
} catch (err) {
  error('Error al crear el release. Asegúrate de tener GitHub CLI instalado y configurado');
}
