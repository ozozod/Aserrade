// Script para limpiar errores de Supabase
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://sunwgbrfumgfurmwjqkb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1bndnYnJmdW1nZnVybXdqcWtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NzE3MzMsImV4cCI6MjA3OTI0NzczM30.jqWZTJx-i-GJllMCuEKEPlIAQIIeErrWBAc1257p1i8'
);

(async () => {
  try {
    // Ver cuantos errores hay
    const { count } = await supabase.from('error_reports').select('*', { count: 'exact', head: true });
    console.log('Total errores encontrados:', count);
    
    if (count > 0) {
      // Eliminar todos los errores
      const { error } = await supabase.from('error_reports').delete().neq('id', 0);
      if (error) {
        console.log('Error eliminando:', error.message);
      } else {
        console.log('✅ Todos los errores eliminados exitosamente');
      }
    } else {
      console.log('No hay errores que eliminar');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
})();

