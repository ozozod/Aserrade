import React, { useState, useEffect } from 'react';
import { backupService } from '../services/backupService';
import { formatearMonedaConSimbolo } from '../utils/formatoMoneda';

const Backups = ({ theme }) => {
  const [backups, setBackups] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [guardarEnSupabase, setGuardarEnSupabase] = useState(false);

  useEffect(() => {
    cargarBackups();
    cargarEstadisticas();
  }, []);

  const cargarBackups = async () => {
    setCargando(true);
    try {
      const lista = await backupService.listarBackups(50);
      setBackups(lista || []);
    } catch (error) {
      mostrarMensaje('Error cargando backups: ' + error.message, 'error');
    } finally {
      setCargando(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const stats = await backupService.obtenerEstadisticas();
      setEstadisticas(stats);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const generarBackup = async () => {
    if (!window.confirm('¿Deseas generar un backup completo de la base de datos ahora?')) {
      return;
    }

    setGenerando(true);
    setMensaje(null);
    
    try {
      const metodo = guardarEnSupabase ? 'ambos' : 'descarga';
      const resultado = await backupService.generarBackup(observaciones || null, metodo);
      
      // Descargar automáticamente el backup
      if (resultado.blob) {
        const url = window.URL.createObjectURL(resultado.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = resultado.nombreArchivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      
      let mensajeExito = `✅ Backup generado exitosamente: ${resultado.nombreArchivo}\n`;
      mensajeExito += `Tamaño: ${formatearTamaño(resultado.tamañoBytes)}\n`;
      mensajeExito += `📥 El archivo se descargó automáticamente a tu carpeta de Descargas\n`;
      
      if (resultado.guardadoEnSupabase) {
        mensajeExito += `☁️ También guardado en Supabase Storage`;
      } else {
        mensajeExito += `💡 Guarda este archivo en un lugar seguro (Google Drive, USB, etc.)`;
      }
      
      mostrarMensaje(mensajeExito, 'success');
      setObservaciones('');
      
      if (resultado.guardadoEnSupabase) {
        await cargarBackups();
        await cargarEstadisticas();
      }
    } catch (error) {
      mostrarMensaje('Error generando backup: ' + error.message, 'error');
    } finally {
      setGenerando(false);
    }
  };

  const descargarBackup = async (backup) => {
    try {
      setCargando(true);
      const blob = await backupService.descargarBackup(backup.ruta_storage);
      
      // Crear enlace de descarga
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = backup.nombre_archivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      mostrarMensaje('Backup descargado exitosamente', 'success');
    } catch (error) {
      mostrarMensaje('Error descargando backup: ' + error.message, 'error');
    } finally {
      setCargando(false);
    }
  };

  const limpiarBackupsAntiguos = async () => {
    const dias = prompt('¿Eliminar backups más antiguos de cuántos días? (por defecto 90):', '90');
    if (!dias) return;
    
    const diasNum = parseInt(dias);
    if (isNaN(diasNum) || diasNum < 1) {
      mostrarMensaje('Por favor ingresa un número válido de días', 'error');
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar todos los backups más antiguos de ${diasNum} días?`)) {
      return;
    }

    setCargando(true);
    try {
      const resultado = await backupService.limpiarBackupsAntiguos(diasNum);
      mostrarMensaje(resultado.mensaje, 'success');
      await cargarBackups();
      await cargarEstadisticas();
    } catch (error) {
      mostrarMensaje('Error limpiando backups: ' + error.message, 'error');
    } finally {
      setCargando(false);
    }
  };

  const formatearTamaño = (bytes) => {
    if (!bytes) return '0 B';
    const mb = bytes / 1024 / 1024;
    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    }
    const kb = bytes / 1024;
    return `${kb.toFixed(2)} KB`;
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 5000);
  };

  return (
    <div style={{ padding: '20px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
      <h1 style={{ marginBottom: '20px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
        💾 Sistema de Backups
      </h1>

      {mensaje && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          borderRadius: '8px',
          backgroundColor: mensaje.tipo === 'success' 
            ? (theme === 'dark' ? '#1e4620' : '#d4edda')
            : (theme === 'dark' ? '#4a1e1e' : '#f8d7da'),
          color: mensaje.tipo === 'success'
            ? (theme === 'dark' ? '#81c784' : '#155724')
            : (theme === 'dark' ? '#e57373' : '#721c24'),
          border: `1px solid ${mensaje.tipo === 'success' ? '#28a745' : '#dc3545'}`,
          whiteSpace: 'pre-line'
        }}>
          {mensaje.texto}
        </div>
      )}

      {/* Estadísticas */}
      {estadisticas && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '30px'
        }}>
          <div style={{
            padding: '15px',
            backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f8f9fa',
            borderRadius: '8px',
            border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
          }}>
            <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666', marginBottom: '5px' }}>
              Total de Backups
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: theme === 'dark' ? '#5dade2' : '#007bff' }}>
              {estadisticas.total_backups || 0}
            </div>
          </div>
          
          <div style={{
            padding: '15px',
            backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f8f9fa',
            borderRadius: '8px',
            border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
          }}>
            <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666', marginBottom: '5px' }}>
              Tamaño Total
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: theme === 'dark' ? '#5dade2' : '#007bff' }}>
              {estadisticas.tamaño_total_mb ? `${estadisticas.tamaño_total_mb} MB` : '0 MB'}
            </div>
          </div>
          
          <div style={{
            padding: '15px',
            backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f8f9fa',
            borderRadius: '8px',
            border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
          }}>
            <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666', marginBottom: '5px' }}>
              Último Backup
            </div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: theme === 'dark' ? '#5dade2' : '#007bff' }}>
              {estadisticas.backup_mas_reciente 
                ? formatearFecha(estadisticas.backup_mas_reciente)
                : 'Nunca'}
            </div>
          </div>
        </div>
      )}

      {/* Generar Backup */}
      <div style={{
        padding: '20px',
        backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
        borderRadius: '8px',
        marginBottom: '30px',
        border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '15px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
          Generar Nuevo Backup
        </h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
            Observaciones (opcional):
          </label>
          <input
            type="text"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ej: Backup antes de actualización importante"
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: theme === 'dark' ? '#404040' : '#fff',
              color: theme === 'dark' ? '#e0e0e0' : 'inherit',
              border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
              borderRadius: '4px'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            id="guardarSupabase"
            checked={guardarEnSupabase}
            onChange={(e) => setGuardarEnSupabase(e.target.checked)}
            style={{
              width: '18px',
              height: '18px',
              cursor: 'pointer'
            }}
          />
          <label 
            htmlFor="guardarSupabase"
            style={{ 
              color: theme === 'dark' ? '#e0e0e0' : 'inherit',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            También guardar en Supabase Storage (opcional, requiere espacio disponible)
          </label>
        </div>
        
        <button
          onClick={generarBackup}
          disabled={generando}
          style={{
            padding: '10px 20px',
            backgroundColor: generando ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: generando ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {generando ? '⏳ Generando...' : '💾 Generar Backup Ahora'}
        </button>
        
        <div style={{ marginTop: '15px', fontSize: '12px', color: theme === 'dark' ? '#999' : '#666' }}>
          ℹ️ El backup incluye: clientes, artículos, remitos, remito_articulos, pagos, saldos_iniciales, usuarios y auditoría<br/>
          📥 El archivo se descargará automáticamente a tu carpeta de Descargas<br/>
          💡 Recomendación: Guarda el archivo en Google Drive, USB o otro lugar seguro
        </div>
      </div>

      {/* Lista de Backups */}
      <div style={{
        padding: '20px',
        backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
        borderRadius: '8px',
        border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ margin: 0, color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
            Historial de Backups
          </h2>
          <button
            onClick={limpiarBackupsAntiguos}
            style={{
              padding: '8px 15px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🗑️ Limpiar Antiguos
          </button>
        </div>

        {cargando ? (
          <div style={{ textAlign: 'center', padding: '40px', color: theme === 'dark' ? '#999' : '#666' }}>
            ⏳ Cargando backups...
          </div>
        ) : backups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: theme === 'dark' ? '#999' : '#666' }}>
            No hay backups registrados aún
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: theme === 'dark' ? '#404040' : '#f8f9fa' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: `2px solid ${theme === 'dark' ? '#555' : '#ddd'}` }}>Fecha</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: `2px solid ${theme === 'dark' ? '#555' : '#ddd'}` }}>Archivo</th>
                <th style={{ padding: '10px', textAlign: 'right', borderBottom: `2px solid ${theme === 'dark' ? '#555' : '#ddd'}` }}>Tamaño</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: `2px solid ${theme === 'dark' ? '#555' : '#ddd'}` }}>Tablas</th>
                <th style={{ padding: '10px', textAlign: 'center', borderBottom: `2px solid ${theme === 'dark' ? '#555' : '#ddd'}` }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((backup) => (
                <tr key={backup.id} style={{ borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#eee'}` }}>
                  <td style={{ padding: '10px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
                    {formatearFecha(backup.fecha_backup)}
                  </td>
                  <td style={{ padding: '10px', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
                    <code style={{ fontSize: '12px' }}>{backup.nombre_archivo}</code>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right', color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
                    {backup.tamaño_mb ? `${backup.tamaño_mb} MB` : formatearTamaño(backup.tamaño_bytes)}
                  </td>
                  <td style={{ padding: '10px', color: theme === 'dark' ? '#999' : '#666', fontSize: '12px' }}>
                    {backup.tablas_incluidas ? backup.tablas_incluidas.join(', ') : '-'}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <button
                      onClick={() => descargarBackup(backup)}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ⬇️ Descargar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Información sobre restauración */}
      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: theme === 'dark' ? '#1e3a5f' : '#e7f3ff',
        borderRadius: '8px',
        border: `1px solid ${theme === 'dark' ? '#5dade2' : '#007bff'}`
      }}>
        <h3 style={{ marginTop: 0, color: theme === 'dark' ? '#e0e0e0' : 'inherit' }}>
          📋 Cómo Restaurar un Backup
        </h3>
        <ol style={{ color: theme === 'dark' ? '#e0e0e0' : 'inherit', lineHeight: '1.8' }}>
          <li>Descarga el archivo .sql del backup que deseas restaurar</li>
          <li>Ve al panel de Supabase → SQL Editor</li>
          <li>Pega el contenido completo del archivo .sql</li>
          <li>Revisa el SQL antes de ejecutar (especialmente las líneas DELETE)</li>
          <li>Ejecuta el script completo</li>
        </ol>
        <p style={{ color: theme === 'dark' ? '#ffd700' : '#856404', fontWeight: 'bold', marginTop: '10px' }}>
          ⚠️ Importante: La restauración sobrescribirá los datos actuales. Asegúrate de hacer un backup antes de restaurar.
        </p>
      </div>
    </div>
  );
};

export default Backups;

