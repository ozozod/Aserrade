/**
 * Script para hacer push inicial al repositorio remoto
 * Ejecutar UNA VEZ antes de usar publish-release.js
 */

const { execSync } = require('child_process');

console.log('🚀 Haciendo push inicial al repositorio...\n');

const token = process.env.GH_TOKEN;
if (!token) {
  console.error('❌ Error: GH_TOKEN no está configurado');
  console.log('Ejecuta: $env:GH_TOKEN = "tu_token_aqui"');
  process.exit(1);
}

try {
  // Primero, restaurar URL correcta (hardcodeada porque sabemos cuál es)
  const repoPath = 'ozozod/Aserrade';
  console.log('📦 Repositorio:', repoPath);
  
  // Restaurar URL limpia primero
  let cleanUrl = `https://github.com/${repoPath}.git`;
  console.log('🔄 Restaurando URL del remoto...');
  execSync(`git remote set-url origin "${cleanUrl}"`, { stdio: 'ignore' });
  
  // Configurar remoto con token
  const newUrl = `https://${token}@github.com/${repoPath}.git`;
  console.log('🔐 Configurando autenticación...');
  execSync(`git remote set-url origin "${newUrl}"`, { stdio: 'inherit' });
  
  // Hacer push
  console.log('📤 Subiendo commits...');
  execSync('git push -u origin main', { stdio: 'inherit' });
  
  // Restaurar URL original (sin token)
  cleanUrl = `https://github.com/${repoPath}.git`;
  console.log('🔄 Restaurando URL original...');
  execSync(`git remote set-url origin "${cleanUrl}"`, { stdio: 'ignore' });
  
  console.log('\n✅ Push completado exitosamente!');
  console.log('Ahora puedes ejecutar: node scripts/publish-release.js');
} catch (err) {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
}
