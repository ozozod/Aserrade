const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uoisgayimsbqugablshq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvaXNnYXlpbXNicXVnYWJsc2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDE3MjEsImV4cCI6MjA3OTIxNzcyMX0.Aswdut5lDyocIqyfksjTXmi_CaUevaAAGIv_kv7ygew';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verificar() {
  console.log('Verificando conexión a Supabase...\n');
  
  // Intentar obtener clientes
  const { data: clientes, error: errClientes } = await supabase.from('clientes').select('*').limit(5);
  console.log('Clientes:', errClientes ? `ERROR: ${errClientes.message}` : `${clientes?.length || 0} encontrados`);
  
  // Intentar obtener remitos
  const { data: remitos, error: errRemitos } = await supabase.from('remitos').select('*').limit(5);
  console.log('Remitos:', errRemitos ? `ERROR: ${errRemitos.message}` : `${remitos?.length || 0} encontrados`);
  
  // Intentar obtener pagos
  const { data: pagos, error: errPagos } = await supabase.from('pagos').select('*').limit(5);
  console.log('Pagos:', errPagos ? `ERROR: ${errPagos.message}` : `${pagos?.length || 0} encontrados`);
  
  // Si hay datos, mostrarlos
  if (clientes && clientes.length > 0) {
    console.log('\n=== Muestra de Clientes ===');
    clientes.forEach(c => console.log(`  - ${c.id}: ${c.nombre}`));
  }
}

verificar();

