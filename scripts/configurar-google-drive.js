/**
 * Script de Configuración para Google Drive
 * 
 * Este script te ayuda a encontrar y configurar tu carpeta de Google Drive
 * 
 * USO:
 * node scripts/configurar-google-drive.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function pregunta(pregunta) {
  return new Promise((resolve) => {
    rl.question(pregunta, (respuesta) => {
      resolve(respuesta);
    });
  });
}

async function configurar() {
  console.log('🔧 Configuración de Google Drive para Backups\n');
  
  const homeDir = os.homedir();
  
  // Buscar carpetas de Google Drive
  const rutasPosibles = [
    path.join(homeDir, 'Google Drive'),
    path.join(homeDir, 'OneDrive', 'Google Drive'),
    path.join(homeDir, 'Documents', 'Google Drive'),
  ];
  
  console.log('🔍 Buscando carpeta de Google Drive...\n');
  
  const carpetasEncontradas = [];
  rutasPosibles.forEach(ruta => {
    if (fs.existsSync(ruta)) {
      carpetasEncontradas.push(ruta);
      console.log(`✅ Encontrada: ${ruta}`);
    }
  });
  
  let carpetaGoogleDrive = null;
  let carpetaBackups = null;
  
  if (carpetasEncontradas.length === 0) {
    console.log('\n⚠️ No se encontró Google Drive Desktop instalado');
    console.log('💡 Opciones:');
    console.log('   1. Instala Google Drive Desktop desde: https://www.google.com/drive/download/');
    console.log('   2. O usa una carpeta personalizada\n');
    
    const usarPersonalizada = await pregunta('¿Quieres usar una carpeta personalizada? (s/n): ');
    if (usarPersonalizada.toLowerCase() === 's') {
      const rutaPersonalizada = await pregunta('Ingresa la ruta completa de la carpeta: ');
      if (fs.existsSync(rutaPersonalizada)) {
        carpetaGoogleDrive = rutaPersonalizada;
      } else {
        console.log('⚠️ La carpeta no existe. Se creará automáticamente.');
        carpetaGoogleDrive = rutaPersonalizada;
      }
    } else {
      console.log('❌ No se puede continuar sin una carpeta de destino');
      rl.close();
      return;
    }
  } else if (carpetasEncontradas.length === 1) {
    carpetaGoogleDrive = carpetasEncontradas[0];
    console.log(`\n✅ Usando: ${carpetaGoogleDrive}`);
  } else {
    console.log('\n📁 Se encontraron múltiples carpetas:');
    carpetasEncontradas.forEach((ruta, index) => {
      console.log(`   ${index + 1}. ${ruta}`);
    });
    
    const seleccion = await pregunta('\nSelecciona el número de la carpeta correcta: ');
    const indice = parseInt(seleccion) - 1;
    if (indice >= 0 && indice < carpetasEncontradas.length) {
      carpetaGoogleDrive = carpetasEncontradas[indice];
    } else {
      console.log('❌ Selección inválida');
      rl.close();
      return;
    }
  }
  
  // Crear carpeta de backups
  carpetaBackups = path.join(carpetaGoogleDrive, 'Backups_Aserradero');
  
  if (!fs.existsSync(carpetaBackups)) {
    fs.mkdirSync(carpetaBackups, { recursive: true });
    console.log(`\n📁 Carpeta creada: ${carpetaBackups}`);
  } else {
    console.log(`\n📁 Carpeta ya existe: ${carpetaBackups}`);
  }
  
  // Leer archivo .env
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Actualizar o agregar BACKUP_DESTINO
  if (envContent.includes('BACKUP_DESTINO=')) {
    envContent = envContent.replace(
      /BACKUP_DESTINO=.*/,
      `BACKUP_DESTINO=${carpetaBackups}`
    );
  } else {
    envContent += `\n# Carpeta de destino para backups automáticos\nBACKUP_DESTINO=${carpetaBackups}\n`;
  }
  
  // Guardar .env
  fs.writeFileSync(envPath, envContent, 'utf8');
  
  console.log('\n✅ Configuración completada!');
  console.log(`📁 Carpeta de backups: ${carpetaBackups}`);
  console.log(`📝 Configuración guardada en: .env`);
  console.log('\n💡 Próximos pasos:');
  console.log('   1. Verifica que Google Drive Desktop esté ejecutándose');
  console.log('   2. Prueba el backup: node scripts/backup-con-google-drive.js');
  console.log('   3. Verifica que el archivo aparezca en Google Drive');
  console.log('   4. Configura Task Scheduler para ejecutar diariamente\n');
  
  rl.close();
}

configurar().catch(console.error);

