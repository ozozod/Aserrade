// Utilidades para formatear valores en la auditoría
import React from 'react';
import { formatearMoneda, formatearMonedaConSimbolo, formatearCantidadDecimal } from './formatoMoneda';

// Nombres descriptivos de campos en español
export const nombresCampos = {
  // Remitos
  'numero': 'Número de Remito',
  'cliente_id': 'Cliente',
  'fecha': 'Fecha',
  'estado_pago': 'Estado de Pago',
  'monto_pagado': 'Monto Pagado',
  'observaciones': 'Observaciones',
  'foto_path': 'Foto del Remito',
  'precio_total': 'Precio Total',
  
  // Clientes
  'nombre': 'Nombre',
  'telefono': 'Teléfono',
  'direccion': 'Dirección',
  'email': 'Email',
  
  // Artículos
  'descripcion': 'Descripción',
  'precio_base': 'Precio Base',
  'activo': 'Estado',
  'medida': 'Medida',
  'cabezal': 'Cabezal',
  'costado': 'Costado',
  'fondo': 'Fondo',
  'taco': 'Taco',
  'esquinero': 'Esquinero',
  'cliente_id': 'Cliente Asociado',
  
  // Pagos
  'monto': 'Monto',
  'remito_id': 'Remito',
  'fecha': 'Fecha de Pago',
  'es_cheque': 'Es Cheque',
  'cheque_rebotado': 'Cheque Rebotado'
};

// Formatear valor según su tipo
export const formatearValorAuditoria = (campo, valor, theme = 'light') => {
  // Manejar valores nulos/vacíos de forma más descriptiva
  const esVacio = valor === null || valor === undefined || valor === '' || (typeof valor === 'string' && valor.trim() === '');
  
  if (esVacio) {
    if (campo === 'foto_path') {
      return <span style={{ color: theme === 'dark' ? '#dc3545' : '#dc3545', fontWeight: 'bold' }}>✗ Sin foto</span>;
    }
    if (campo === 'observaciones' || campo === 'descripcion') {
      return <span style={{ fontStyle: 'italic', color: theme === 'dark' ? '#999' : '#666', fontSize: '13px' }}>📝 Sin texto</span>;
    }
    if (campo.includes('precio') || campo.includes('monto')) {
      return <span style={{ fontStyle: 'italic', color: theme === 'dark' ? '#999' : '#666' }}>$ 0</span>;
    }
    return <span style={{ fontStyle: 'italic', color: theme === 'dark' ? '#999' : '#666' }}>❌ Vacío</span>;
  }
  
  // Formatear según el tipo de campo
  if (campo.includes('precio') || campo.includes('monto') || campo === 'precio_base' || campo === 'precio_total') {
    // Valores monetarios
    const numValor = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (!isNaN(numValor)) {
      return <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>
        {formatearMonedaConSimbolo(numValor)}
      </strong>;
    }
  }
  
  if (campo === 'foto_path' || (typeof valor === 'string' && (valor.startsWith('http') || valor.startsWith('data:image')))) {
    // URLs de imágenes o base64
    if (valor === null || valor === '') {
      return <span style={{ color: theme === 'dark' ? '#dc3545' : '#dc3545', fontWeight: 'bold' }}>✗ Sin foto</span>;
    }
    
    // Si es base64, mostrar la imagen directamente
    if (typeof valor === 'string' && valor.startsWith('data:image')) {
      return (
        <div style={{ fontSize: '12px' }}>
          <div style={{ color: theme === 'dark' ? '#999' : '#666', marginBottom: '5px' }}>📷 Imagen:</div>
          <img 
            src={valor} 
            alt="Imagen del remito" 
            style={{ 
              maxWidth: '200px', 
              maxHeight: '150px', 
              borderRadius: '5px',
              border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
              cursor: 'pointer'
            }}
            onClick={() => {
              // Abrir imagen en modal grande
              const modal = document.createElement('div');
              modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; cursor: pointer;';
              const img = document.createElement('img');
              img.src = valor;
              img.style.cssText = 'max-width: 90%; max-height: 90%; border-radius: 8px;';
              modal.appendChild(img);
              modal.onclick = () => document.body.removeChild(modal);
              document.body.appendChild(modal);
            }}
            title="Click para ver imagen completa"
          />
        </div>
      );
    }
    
    // Si es URL, mostrar como antes
    const urlCorta = valor.length > 60 ? valor.substring(0, 60) + '...' : valor;
    return (
      <div style={{ fontSize: '12px' }}>
        <div style={{ color: theme === 'dark' ? '#999' : '#666', marginBottom: '5px' }}>📷 URL:</div>
        <div style={{ 
          wordBreak: 'break-all', 
          color: theme === 'dark' ? '#5dade2' : '#007bff',
          fontFamily: 'monospace'
        }}>
          {urlCorta}
        </div>
      </div>
    );
  }
  
  if (campo === 'activo') {
    // Estado activo/inactivo
    const estaActivo = valor === true || valor === 1 || valor === '1' || valor === 'true';
    return (
      <span style={{ 
        color: estaActivo ? (theme === 'dark' ? '#51cf66' : '#28a745') : (theme === 'dark' ? '#ff6b6b' : '#dc3545'),
        fontWeight: 'bold'
      }}>
        {estaActivo ? '✓ Activo' : '✗ Inactivo'}
      </span>
    );
  }
  
  if (campo === 'es_cheque' || campo === 'cheque_rebotado') {
    // Valores booleanos específicos de cheques
    const esTrue = valor === true || valor === 1 || valor === '1' || valor === 'true';
    
    if (campo === 'es_cheque') {
      return (
        <span style={{ 
          color: esTrue ? (theme === 'dark' ? '#ffc107' : '#ffc107') : (theme === 'dark' ? '#999' : '#666'),
          fontWeight: 'bold'
        }}>
          {esTrue ? '✓ Es Cheque' : '✗ No es Cheque'}
        </span>
      );
    }
    
    if (campo === 'cheque_rebotado') {
      return (
        <span style={{ 
          color: esTrue ? (theme === 'dark' ? '#ff6b6b' : '#dc3545') : (theme === 'dark' ? '#51cf66' : '#28a745'),
          fontWeight: 'bold'
        }}>
          {esTrue ? '🚫 Rebotado' : '✓ Válido'}
        </span>
      );
    }
  }
  
  if (campo === 'estado_pago') {
    // Estados de pago
    const estados = {
      'Pagado': { color: theme === 'dark' ? '#51cf66' : '#28a745', icon: '✓' },
      'Pendiente': { color: theme === 'dark' ? '#ff6b6b' : '#dc3545', icon: '⚠' },
      'Pago Parcial': { color: theme === 'dark' ? '#ffc107' : '#ffc107', icon: '◐' }
    };
    const estado = estados[valor] || { color: theme === 'dark' ? '#999' : '#666', icon: '○' };
    return (
      <span style={{ color: estado.color, fontWeight: 'bold' }}>
        {estado.icon} {valor}
      </span>
    );
  }
  
  if (campo.includes('fecha') || (typeof valor === 'string' && valor.match(/^\d{4}-\d{2}-\d{2}/))) {
    // Fechas
    try {
      const fecha = new Date(valor);
      if (!isNaN(fecha.getTime())) {
        return fecha.toLocaleDateString('es-AR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      }
    } catch (e) {
      // Continuar con el valor original
    }
  }
  
  // Valores booleanos
  if (typeof valor === 'boolean') {
    return valor ? 'Sí' : 'No';
  }
  
  // Valores numéricos - formatear con 2 decimales y separadores de miles
  if (typeof valor === 'number') {
    // Si es un número entero o con decimales, formatear con 2 decimales
    return formatearCantidadDecimal(valor);
  }
  
  // Si es string numérico, convertir y formatear
  if (typeof valor === 'string' && valor.trim() !== '') {
    // Intentar parsear como número (puede tener puntos o comas)
    const valorLimpio = valor.replace(/\./g, '').replace(',', '.');
    const numValor = parseFloat(valorLimpio);
    
    if (!isNaN(numValor)) {
      // Si el campo es cantidad, precio_unitario, precio_total, monto, etc., formatear
      if (campo.includes('cantidad') || campo.includes('precio') || campo.includes('monto')) {
        if (campo.includes('precio') || campo.includes('monto')) {
          return <strong style={{ color: theme === 'dark' ? '#5dade2' : '#007bff' }}>
            ${formatearMoneda(numValor)}
          </strong>;
        } else {
          return formatearCantidadDecimal(numValor);
        }
      }
      // Si el campo parece numérico pero no es precio/monto/cantidad, formatear como cantidad
      return formatearCantidadDecimal(numValor);
    }
  }
  
  // Strings largos - truncar si es muy largo
  if (typeof valor === 'string' && valor.length > 100) {
    return (
      <div>
        <div>{valor.substring(0, 100)}...</div>
        <div style={{ fontSize: '11px', color: theme === 'dark' ? '#666' : '#999', marginTop: '5px' }}>
          (Texto completo: {valor.length} caracteres)
        </div>
      </div>
    );
  }
  
  // Valores por defecto
  return String(valor);
};

// Obtener nombre descriptivo del campo
export const getNombreCampo = (campo) => {
  return nombresCampos[campo] || campo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};