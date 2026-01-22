/**
 * Script para incrementar la versión de la aplicación
 * 
 * USO:
 *   node scripts/bump-version.js [major|minor|patch]
 * 
 * EJEMPLOS:
 *   node scripts/bump-version.js patch   // 2.0.1 → 2.0.2
 *   node scripts/bump-version.js minor   // 2.0.1 → 2.1.0
 *   node scripts/bump-version.js major   // 2.0.1 → 3.0.0
 */

const fs = require('fs');
const path = require('path');

// Obtener tipo de bump desde argumentos
const bumpType = process.argv[2] || 'patch';

if (!['major', 'minor', 'patch'].includes(bumpType)) {
  console.error('❌ Tipo de bump inválido. Usa: major, minor o patch');
  process.exit(1);
}

// Leer package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Parsear versión actual
const [major, minor, patch] = packageJson.version.split('.').map(Number);

// Calcular nueva versión
let newVersion;
switch (bumpType) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

console.log(`📦 Actualizando versión: ${packageJson.version} → ${newVersion}`);

// Actualizar package.json
packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

console.log('✅ package.json actualizado');

// Preparar entrada para CHANGELOG
const today = new Date().toISOString().split('T')[0];
const changelogEntry = `
## [Versión ${newVersion}] - ${today}

### 🐛 Correcciones de Bugs
- (Agregar descripción de los bugs corregidos)

### ✨ Mejoras
- (Agregar descripción de las mejoras)

### 🔧 Cambios Técnicos
- (Agregar detalles técnicos)

---

`;

// Leer CHANGELOG actual
const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
let changelog = fs.readFileSync(changelogPath, 'utf8');

// Insertar nueva entrada después del encabezado
const lines = changelog.split('\n');
const insertIndex = lines.findIndex(line => line.startsWith('## [Versión'));

if (insertIndex !== -1) {
  lines.splice(insertIndex, 0, changelogEntry);
  changelog = lines.join('\n');
  fs.writeFileSync(changelogPath, changelog);
  console.log('✅ CHANGELOG.md actualizado');
}

console.log(`
📝 SIGUIENTE PASO:
   1. Edita CHANGELOG.md y documenta los cambios
   2. Commit: git add . && git commit -m "chore: bump version to ${newVersion}"
   3. Push: git push origin main
   4. Build: npm run build:win
   5. Publish: node scripts/publish-release.js
`);
