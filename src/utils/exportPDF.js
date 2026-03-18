import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatearMoneda, formatearMonedaConSimbolo, formatearCantidad, formatearCantidadDecimal, sumarPagosSaldoAFavorAplicado } from './formatoMoneda';
import { calcularTotalesCuentaCorriente } from './cuentaCorrienteCalculos';

// Función auxiliar para cargar imagen desde URL
const loadImageFromUrl = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

// Función para limpiar observaciones de pagos (quitar info técnica)
const limpiarConceptoPago = (observaciones) => {
  if (!observaciones) return 'PAGO';
  
  let concepto = observaciones;
  
  // Quitar la parte de REMITOS_DETALLE y todo lo que sigue (JSON)
  if (concepto.includes('REMITOS_DETALLE')) {
    concepto = concepto.split('|')[0].trim();
    concepto = concepto.split('REMITOS_DETALLE')[0].trim();
  }
  
  // Quitar [OCULTO] y texto después
  if (concepto.includes('[OCULTO]')) {
    return 'PAGO';
  }
  
  // Quitar [ADELANTO]
  if (concepto.includes('[ADELANTO]')) {
    concepto = concepto.replace('[ADELANTO]', '').trim();
    if (concepto.length < 2) return 'ADELANTO';
  }
  
  // En exportados mostrar solo el detalle del usuario, no "Saldo a favor aplicado - ..."
  if (concepto.toLowerCase().includes('saldo a favor aplicado')) {
    const idx = concepto.toLowerCase().indexOf('saldo a favor aplicado');
    const despues = concepto.slice(idx + 'saldo a favor aplicado'.length).replace(/^\s*[-–]\s*/, '').trim();
    concepto = despues || 'Pago a cuenta';
  }
  
  // Si dice "Pago completo" o "Pago agrupado" o "Pago parcial", simplificar
  if (concepto.toLowerCase().includes('pago completo')) {
    return 'PAGO';
  } else if (concepto.toLowerCase().includes('pago agrupado')) {
    return 'PAGO';
  } else if (concepto.toLowerCase().includes('pago parcial')) {
    return 'PAGO';
  }
  
  // Limpiar espacios extra y caracteres especiales al final
  concepto = concepto.replace(/\s*\|\s*$/, '').trim();
  
  // Si quedó vacío, poner texto por defecto
  if (!concepto || concepto.length < 2) {
    return 'PAGO';
  }
  
  // El detalle ingresado por el usuario se muestra
  // Limitar longitud para que quepa bien en la tabla (columna más ancha)
  if (concepto.length > 50) {
    concepto = concepto.substring(0, 47) + '...';
  }
  
  return concepto;
};

// Formatear fecha YYYY-MM-DD sin corrimiento por zona horaria
const formatearFechaYYYYMMDD = (value) => {
  if (!value) return '';
  if (typeof value === 'string') {
    const fechaStr = value.includes('T') ? value.split('T')[0] : value;
    const partes = fechaStr.split('-');
    if (partes.length === 3) {
      const [y, m, d] = partes;
      if (y && m && d) return `${d}/${m}/${y}`;
    }
  }
  const d = new Date(value);
  return d.toLocaleDateString('es-AR');
};

// Construye movimientos (remitos/pagos) en el formato usado por las tablas
const construirMovimientos = (remitos, pagos) => {
  const movimientos = [];
  
  remitos.forEach(remito => {
    const articulos = remito.articulos || [];
    const precioTotal = parseFloat(remito.precio_total || 0);
    
    if (articulos.length > 0) {
      // Función para convertir índice a letra (0=A, 1=B, 2=C, etc.)
      const indexToLetter = (idx) => String.fromCharCode(65 + idx);
      const tieneMultiplesArticulos = articulos.length > 1;
      
      articulos.forEach((articulo, index) => {
        // Si hay múltiples artículos, agregar letra al número
        const numeroBase = remito.numero || `REM-${remito.id}`;
        const numeroConLetra = tieneMultiplesArticulos 
          ? `${numeroBase} ${indexToLetter(index)}`
          : numeroBase;
        
        movimientos.push({
          tipo: 'remito',
          fecha: new Date(remito.fecha),
          fechaStr: new Date(remito.fecha).toLocaleDateString('es-AR'),
          numero: numeroConLetra,
          concepto: articulo.articulo_nombre || '-',
          codigo: articulo.articulo_codigo || '-',
          cantidad: formatearCantidadDecimal(articulo.cantidad || 0),
          precioUnitario: formatearMonedaConSimbolo(parseFloat(articulo.precio_unitario || 0)),
          total: articulo.precio_total || (articulo.cantidad * articulo.precio_unitario) || 0,
          pago: 0,
          id: remito.id,
          remitoId: remito.id, // ID del remito original para agrupar
          orden: index,
          tieneMultiplesArticulos: tieneMultiplesArticulos,
          numeroBase: numeroBase // Número base sin letra para agrupar
        });
      });
    } else {
      movimientos.push({
        tipo: 'remito',
        fecha: new Date(remito.fecha),
        fechaStr: new Date(remito.fecha).toLocaleDateString('es-AR'),
        numero: remito.numero || `REM-${remito.id}`,
        concepto: '-',
        codigo: '-',
        cantidad: '0',
        precioUnitario: '-',
        total: precioTotal,
        pago: 0,
        id: remito.id,
        remitoId: remito.id,
        orden: 0,
        tieneMultiplesArticulos: false,
        numeroBase: remito.numero || `REM-${remito.id}`
      });
    }
  });
  
  const pagosAgrupados = {};
  pagos.forEach(pago => {
    const obs = pago.observaciones || '';
    
    // Si es un pago oculto, ignorarlo (ya está contado en el pago principal)
    if (obs.includes('[OCULTO]')) return;
    
    // Si tiene REMITOS_DETALLE, es un pago agrupado - sumar los montos de los remitos
    if (obs.includes('REMITOS_DETALLE')) {
      try {
        const jsonMatch = obs.match(/REMITOS_DETALLE:(\[.*\])/);
        if (jsonMatch) {
          const remitosDetalle = JSON.parse(jsonMatch[1]);
          const montoTotal = remitosDetalle.reduce((sum, r) => sum + parseFloat(r.monto || 0), 0);
          
          // Construir concepto sin información de remitos (solo el detalle del pago)
          let conceptoBase = limpiarConceptoPago(obs);
          
          pagosAgrupados[pago.id] = {
            fecha: new Date(pago.fecha),
            fechaStr: new Date(pago.fecha).toLocaleDateString('es-AR'),
            concepto: conceptoBase,
            montoTotal: montoTotal,
            id: pago.id,
            es_cheque: pago.es_cheque === 1 || pago.es_cheque === true || pago.es_cheque === '1',
            cheque_rebotado: pago.cheque_rebotado === 1 || pago.cheque_rebotado === true || pago.cheque_rebotado === '1',
            remitosDetalle: remitosDetalle,
            observaciones: obs
          };
          return;
        }
      } catch (e) {
        console.warn('Error parseando REMITOS_DETALLE:', e);
      }
    }
    
    // Pago normal o adelanto - mostrar individualmente (sin información de remitos)
    let conceptoPago = limpiarConceptoPago(obs);
    
    pagosAgrupados[pago.id] = {
      fecha: new Date(pago.fecha),
      fechaStr: new Date(pago.fecha).toLocaleDateString('es-AR'),
      concepto: conceptoPago,
      codigo: '',
      montoTotal: parseFloat(pago.monto || 0),
      id: pago.id,
      es_cheque: pago.es_cheque === 1 || pago.es_cheque === true || pago.es_cheque === '1',
      cheque_rebotado: pago.cheque_rebotado === 1 || pago.cheque_rebotado === true || pago.cheque_rebotado === '1',
      observaciones: obs
    };
  });
  
  // Agregar pagos agrupados a movimientos (incluir cheques rebotados aunque tengan monto 0)
  Object.values(pagosAgrupados).forEach(pagoAgrupado => {
    // Verificar cheque rebotado (puede venir como 0/1 de la base de datos)
    const chequeRebotado = pagoAgrupado.cheque_rebotado === 1 || pagoAgrupado.cheque_rebotado === true || pagoAgrupado.cheque_rebotado === '1';
    const esCheque = pagoAgrupado.es_cheque === 1 || pagoAgrupado.es_cheque === true || pagoAgrupado.es_cheque === '1';
    
    // Incluir si tiene monto > 0 O si es un cheque rebotado (debe aparecer aunque tenga monto 0)
    if (pagoAgrupado.montoTotal > 0 || chequeRebotado) {
      // Si es cheque rebotado, agregar indicador al concepto (sin emojis para PDF)
      let concepto = pagoAgrupado.concepto;
      
      if (chequeRebotado) {
        concepto = `[CHEQUE REBOTADO] ${concepto}`;
      } else if (esCheque) {
        concepto = `[CHEQUE] ${concepto}`;
      }
      
      movimientos.push({
        tipo: 'pago',
        fecha: pagoAgrupado.fecha,
        fechaStr: pagoAgrupado.fechaStr,
        numero: '',
        concepto: concepto,
        codigo: '',
        cantidad: '',
        precioUnitario: '',
        total: 0,
        pago: pagoAgrupado.montoTotal,
        id: pagoAgrupado.id,
        orden: 0,
        es_cheque: pagoAgrupado.es_cheque,
        cheque_rebotado: pagoAgrupado.cheque_rebotado,
        observaciones: pagoAgrupado.observaciones || ''
      });
    }
  });
  movimientos.sort((a, b) => {
    const fechaDiff = a.fecha - b.fecha;
    if (fechaDiff !== 0) return fechaDiff;
    if (a.tipo === 'remito' && b.tipo === 'pago') return -1;
    if (a.tipo === 'pago' && b.tipo === 'remito') return 1;
    if (a.id !== b.id) return a.id - b.id;
    return a.orden - b.orden;
  });
  
  // Asignar clave única para mapear saldos
  movimientos.forEach(mov => {
    mov.clave = mov.tipo === 'remito' ? `remito-${mov.id}-${mov.orden}` : `pago-${mov.id}`;
  });
  
  return movimientos;
};

// Calcula saldos usando historial completo y devuelve mapa clave->saldo (DEBE = deuda pendiente después de cada movimiento)
const calcularSaldosDesdeHistorial = (movimientosHistorial, saldoPendienteResumen, montoSaldoInicial = 0) => {
  // saldoAcumulado representa deuda neta:
  // - positivo => el cliente debe
  // - negativo => saldo a favor
  // Convención: saldo inicial > 0 (a favor) arranca negativo; saldo inicial < 0 (deuda) arranca positivo
  let saldoAcumulado = -(parseFloat(montoSaldoInicial || 0) || 0);
  const saldoPorClave = new Map();
  
  movimientosHistorial.forEach(mov => {
    const chequeRebotado = mov.cheque_rebotado === 1 || mov.cheque_rebotado === true || mov.cheque_rebotado === '1';

    if (!chequeRebotado) {
      saldoAcumulado += mov.total - mov.pago;
      saldoPorClave.set(mov.clave, saldoAcumulado);
    } else {
      saldoPorClave.set(mov.clave, saldoAcumulado);
    }
  });
  
  // Ajustar última fila para que DEBE cierre con el resumen (Saldo Pendiente)
  if (movimientosHistorial.length > 0) {
    const ultimo = movimientosHistorial[movimientosHistorial.length - 1];
    const ultimoEsChequeRebotado = ultimo.cheque_rebotado === 1 || ultimo.cheque_rebotado === true || ultimo.cheque_rebotado === '1';
    if (!ultimoEsChequeRebotado) {
      const valorCierre = saldoPendienteResumen ?? saldoAcumulado;
      saldoPorClave.set(ultimo.clave, valorCierre);
    }
  }
  
  return saldoPorClave;
};

export const exportCuentaCorrientePDF = async (cliente, cuentaCorriente) => {
  const doc = new jsPDF();
  
  // ========== ENCABEZADO PROFESIONAL ==========
  doc.setFillColor(34, 45, 65);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('ESTADO DE CUENTA', 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Mostrar rango de fechas si existe
  const rangoFechas = cuentaCorriente.rangoFechas;
  if (rangoFechas && (rangoFechas.desde || rangoFechas.hasta)) {
    let textoRango = 'Período: ';
    if (rangoFechas.desde) textoRango += formatearFechaYYYYMMDD(rangoFechas.desde);
    else textoRango += 'Inicio';
    textoRango += ' - ';
    if (rangoFechas.hasta) textoRango += formatearFechaYYYYMMDD(rangoFechas.hasta);
    else textoRango += 'Hoy';
    doc.text(textoRango, 105, 28, { align: 'center' });
  } else {
    doc.text(`${new Date().toLocaleDateString('es-AR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })}`, 105, 28, { align: 'center' });
  }
  
  let yPosition = 45;
  
  // ========== INFORMACIÓN DEL CLIENTE ==========
  doc.setFillColor(245, 247, 250);
  doc.rect(10, yPosition, 190, 45, 'F');
  doc.setDrawColor(34, 45, 65);
  doc.setLineWidth(0.3);
  doc.rect(10, yPosition, 190, 45);
  
  doc.setTextColor(34, 45, 65);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DEL CLIENTE', 15, yPosition + 8);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  // Datos del cliente en formato compacto
  let yDatos = yPosition + 18;
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', 15, yDatos);
  doc.setFont('helvetica', 'normal');
  doc.text(cliente.nombre, 40, yDatos);
  
  if (cliente.telefono) {
    doc.text('Tel:', 120, yDatos);
    doc.text(cliente.telefono, 135, yDatos);
  }
  yDatos += 6;
  
  if (cliente.direccion) {
    doc.setFont('helvetica', 'bold');
    doc.text('Dirección:', 15, yDatos);
    doc.setFont('helvetica', 'normal');
    doc.text(cliente.direccion, 40, yDatos);
    yDatos += 6;
  }
  
  if (cliente.email) {
    doc.setFont('helvetica', 'bold');
    doc.text('Email:', 15, yDatos);
    doc.setFont('helvetica', 'normal');
    doc.text(cliente.email, 40, yDatos);
  }
  
  yPosition = yPosition + 55; // Después de la caja del cliente
  
  // ========== CUENTA CORRIENTE ==========
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 45, 65);
  doc.text('CUENTA CORRIENTE', 15, yPosition);
  yPosition += 5;

  // Saldo inicial
  const saldoInicial = cuentaCorriente.saldoInicial;
  const montoSaldoInicial = saldoInicial ? parseFloat(saldoInicial.monto || 0) : 0;
  const esAFavor = montoSaldoInicial > 0;

  // Construir movimientos para cálculo de saldos (historial completo)
  const movimientosHistorial = construirMovimientos(
    cuentaCorriente.remitosHistorico || cuentaCorriente.remitos || [],
    cuentaCorriente.pagosHistorico || cuentaCorriente.pagos || []
  );
  
  // Construir movimientos filtrados (lo que se mostrará)
  const movimientosFiltrados = construirMovimientos(
    cuentaCorriente.remitos || [],
    cuentaCorriente.pagos || []
  );
  
  // Calcular saldos: usar total_pendiente del backend para que la tabla cierre con el resumen
  const saldoPendienteResumen = cuentaCorriente.totales?.total_pendiente ?? ((cuentaCorriente.totales?.total_remitos || 0) - (cuentaCorriente.totales?.total_pagado || 0) - montoSaldoInicial);
  const saldoPorClave = calcularSaldosDesdeHistorial(
    movimientosHistorial,
    saldoPendienteResumen,
    montoSaldoInicial
  );
  
  const movimientosConSaldo = movimientosFiltrados.map(mov => ({
    ...mov,
    saldo: saldoPorClave.has(mov.clave) ? saldoPorClave.get(mov.clave) : mov.total - mov.pago
  }));

  // Si hay saldo inicial, agregarlo como primera fila de la tabla
  let filasSaldoInicial = [];
  if (montoSaldoInicial !== 0) {
    const fechaRef = saldoInicial.fecha_referencia
      ? new Date(saldoInicial.fecha_referencia).toLocaleDateString('es-AR')
      : '';
    const textoBase = saldoInicial.descripcion || 'Saldo inicial';
    const montoSIAbs = Math.abs(montoSaldoInicial);
    // Mostrar siempre en la columna DEBE. Si es a favor, lo mostramos como negativo para que se entienda.
    const debeStr = esAFavor
      ? `- ${formatearMonedaConSimbolo(montoSIAbs)}`
      : formatearMonedaConSimbolo(montoSIAbs);
    filasSaldoInicial = [[
      'S.I.',
      fechaRef,
      '',
      textoBase,
      '',
      '',
      '',
      '',      // PAGA A CTA (saldo inicial se muestra en DEBE)
      debeStr  // DEBE
    ]];
  }
  
  // Preparar datos para la tabla (guardamos info extra para estilos)
  const movimientosInfo = movimientosConSaldo.map(mov => ({
    esPago: mov.tipo === 'pago',
    chequeRebotado: mov.cheque_rebotado === 1 || mov.cheque_rebotado === true || mov.cheque_rebotado === '1',
    esCheque: mov.es_cheque === 1 || mov.es_cheque === true || mov.es_cheque === '1',
    remitoId: mov.remitoId || null,
    tieneMultiplesArticulos: mov.tieneMultiplesArticulos || false,
    numeroBase: mov.numeroBase || null
  }));
  
  // Crear un mapa de remitos con múltiples artículos para aplicar colores
  const remitosConMultiplesArticulos = new Map();
  movimientosConSaldo.forEach((mov, index) => {
    if (mov.tipo === 'remito' && mov.tieneMultiplesArticulos && mov.remitoId) {
      if (!remitosConMultiplesArticulos.has(mov.remitoId)) {
        remitosConMultiplesArticulos.set(mov.remitoId, []);
      }
      remitosConMultiplesArticulos.get(mov.remitoId).push(index);
    }
  });
  
  // Colores para agrupar remitos (colores suaves y alternados)
  const coloresGrupo = [
    [240, 248, 255], // Azul muy claro
    [255, 250, 240], // Beige muy claro
    [240, 255, 240], // Verde muy claro
    [255, 240, 245], // Rosa muy claro
    [245, 245, 250]  // Gris muy claro
  ];
  
  const cuentaCorrienteData = [
    ...filasSaldoInicial,
    ...movimientosConSaldo.map(mov => {
      const esPago = mov.tipo === 'pago';
      return [
        mov.numero,
        mov.fechaStr,
        mov.codigo || '',
        mov.concepto,
        mov.cantidad,
        mov.precioUnitario,
        mov.total > 0 ? formatearMonedaConSimbolo(mov.total) : '',
        esPago ? formatearMonedaConSimbolo(mov.pago) : '',
        formatearMonedaConSimbolo(mov.saldo)
      ];
    })
  ];
  
  // Tabla de cuenta corriente estilo Excel
  doc.autoTable({
    startY: yPosition,
    head: [['REMITO', 'FECHA', 'CÓDIGO', 'PRODUCTO', 'CANT.', '$ UNIT.', 'TOTAL', 'PAGA A CTA', 'DEBE']],
    body: cuentaCorrienteData,
    margin: { left: 8, right: 8 },
    styles: { 
      fontSize: 7,
      cellPadding: 2,
      overflow: 'linebreak',
      valign: 'middle',
      lineColor: [180, 180, 180],
      lineWidth: 0.1
    },
    headStyles: { 
      fillColor: [34, 45, 65],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 7.5,
      cellPadding: 2.5
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center' }, // REMITO
      1: { cellWidth: 15 }, // FECHA
      2: { cellWidth: 16, halign: 'center' }, // CÓDIGO
      3: { cellWidth: 50 }, // PRODUCTO/DETALLE (reducido para hacer espacio al código)
      4: { cellWidth: 18, halign: 'right' }, // CANT.
      5: { cellWidth: 17, halign: 'right' }, // $ UNIT.
      6: { cellWidth: 20, halign: 'right', fontStyle: 'bold' }, // TOTAL
      7: { cellWidth: 20, halign: 'right', textColor: [40, 167, 69] }, // PAGA A CTA
      8: { cellWidth: 21, halign: 'right', fontStyle: 'bold' } // DEBE
    },
    // Colorear filas de pagos (verde normal, rojo si cheque rebotado) y agrupar remitos
    didParseCell: function(data) {
      if (data.section === 'body') {
        const rowData = cuentaCorrienteData[data.row.index];
        // La primera fila puede ser saldo inicial
        const offsetSaldo = filasSaldoInicial.length;
        const esSaldoInicialRow = data.row.index < offsetSaldo;

        // Colorear fila de saldo inicial (verde si a favor, rojo si deuda)
        if (esSaldoInicialRow) {
          if (esAFavor) {
            data.cell.styles.fillColor = [230, 255, 230]; // verde muy claro
            data.cell.styles.textColor = [40, 167, 69]; // verde (texto)
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.fillColor = [255, 205, 210]; // rojo suave
            data.cell.styles.textColor = [180, 0, 0];
            data.cell.styles.fontStyle = 'bold';
          }
          return;
        }

        const movInfo = movimientosInfo[data.row.index - offsetSaldo];
        const mov = movimientosConSaldo[data.row.index - offsetSaldo];
        
        // Colorear columna DEBE según si es positivo (a favor) o negativo (deuda)
        if (data.column.index === 8 && mov) { // Columna DEBE
          const saldo = mov.saldo || 0;
          if (saldo < 0) {
            // Saldo a favor (negativo) - azul/verde claro
            data.cell.styles.fillColor = [230, 245, 255]; // Azul muy claro
            data.cell.styles.textColor = [23, 162, 184]; // Azul (texto)
            data.cell.styles.fontStyle = 'bold';
          } else if (saldo > 0) {
            // Deuda (positivo) - rojo claro
            data.cell.styles.fillColor = [255, 240, 240]; // Rojo muy claro
            data.cell.styles.textColor = [220, 53, 69]; // Rojo (texto)
            data.cell.styles.fontStyle = 'bold';
          } else {
            // Saldo cero - verde claro
            data.cell.styles.fillColor = [240, 255, 240]; // Verde muy claro
            data.cell.styles.textColor = [40, 167, 69]; // Verde (texto)
            data.cell.styles.fontStyle = 'bold';
          }
        }
        
        // Verificar si es un pago usando movInfo.esPago (más confiable)
        if (movInfo && movInfo.esPago) {
          // Cheque rebotado - fondo rojo claro, texto rojo
          if (movInfo.chequeRebotado) {
            data.cell.styles.fillColor = [255, 230, 230]; // Rojo muy claro
            data.cell.styles.textColor = [200, 30, 30]; // Rojo
            data.cell.styles.fontStyle = 'bold';
          } else {
            // Pago normal - verde claro
            data.cell.styles.fillColor = [230, 255, 230]; // Verde muy claro para pagos
            if (data.column.index === 7) { // PAGA A CTA ahora está en la columna 7
              data.cell.styles.textColor = [40, 167, 69]; // Verde para el monto
              data.cell.styles.fontStyle = 'bold';
            }
          }
        } else if (movInfo && movInfo.tieneMultiplesArticulos && movInfo.remitoId) {
          // Es un remito con múltiples artículos - aplicar estilo de agrupación
          const indicesRemito = remitosConMultiplesArticulos.get(movInfo.remitoId);
          if (indicesRemito && indicesRemito.includes(data.row.index)) {
            // Encontrar el índice del remito en el mapa para asignar color
            let remitoIndex = 0;
            for (const [remitoId, indices] of remitosConMultiplesArticulos.entries()) {
              if (remitoId === movInfo.remitoId) break;
              remitoIndex++;
            }
            const colorGrupo = coloresGrupo[remitoIndex % coloresGrupo.length];
            
            // Aplicar color de fondo suave
            data.cell.styles.fillColor = colorGrupo;
            
            // Borde izquierdo más grueso en la primera columna para agrupar visualmente
            if (data.column.index === 0) {
              data.cell.styles.lineWidth = { left: 0.5 };
              data.cell.styles.lineColor = { left: [70, 130, 180] }; // Azul acero
            }
            
            // Texto en negrita para el número del remito
            if (data.column.index === 0) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.textColor = [25, 25, 112]; // Azul marino
            }
          }
        }
      }
    }
  });

  let finalTableY = doc.lastAutoTable.finalY;

  // ========== RESUMEN FINANCIERO PROFESIONAL ==========
  const resumenY = finalTableY + 15;
  
  // Verificar si necesitamos nueva página para el resumen
  if (resumenY > doc.internal.pageSize.height - 60) {
    doc.addPage();
    yPosition = 20;
  } else {
    yPosition = resumenY;
  }
  
  // Caja del resumen financiero
  const resumenHeight = 45;
  doc.setFillColor(245, 247, 250);
  doc.rect(10, yPosition, 190, resumenHeight, 'F');
  doc.setDrawColor(34, 45, 65);
  doc.setLineWidth(0.3);
  doc.rect(10, yPosition, 190, resumenHeight);
  
  // Título del resumen
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 45, 65);
  doc.text('RESUMEN FINANCIERO', 105, yPosition + 10, { align: 'center' });
  
  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(20, yPosition + 14, 190, yPosition + 14);
  
  // Totales en formato profesional
  let yResumen = yPosition + 22;
  doc.setFontSize(10);
  
  // Total Facturado
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('Total Facturado:', 15, yResumen);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 45, 65);
  doc.text(formatearMonedaConSimbolo(cuentaCorriente.totales.total_remitos || 0), 195, yResumen, { align: 'right' });
  yResumen += 7;
  
  // Total Pagado: solo pagos reales (no incluir saldo inicial)
  const totalPagadoMostrar = cuentaCorriente.totales.total_pagado || 0;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('Total Pagado:', 15, yResumen);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 167, 69);
  doc.text(formatearMonedaConSimbolo(totalPagadoMostrar), 195, yResumen, { align: 'right' });
  yResumen += 7;

  // Saldo pendiente: viene del backend (incluye saldo inicial con signo)
  const saldoPendiente = cuentaCorriente.totales.total_pendiente ?? ((cuentaCorriente.totales.total_remitos || 0) - (cuentaCorriente.totales.total_pagado || 0) - montoSaldoInicial);
  const totalesCalc = calcularTotalesCuentaCorriente({
    totalRemitos: cuentaCorriente.totales.total_remitos || 0,
    totalPagado: cuentaCorriente.totales.total_pagado || 0,
    saldoInicialMonto: montoSaldoInicial,
    pagos: cuentaCorriente.pagos || []
  });
  // Si total_pendiente es negativo, saldo a favor = saldo neto; si no, mostrar crédito restante (si existe)
  const saldoAFavorMostrar = saldoPendiente < 0 ? Math.abs(saldoPendiente) : (totalesCalc.meta?.creditoRestante || 0);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  if (saldoPendiente > 0) {
    // Cliente debe dinero
    doc.text('Saldo Pendiente:', 15, yResumen);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 53, 69); // Rojo
    doc.text(formatearMonedaConSimbolo(saldoPendiente), 195, yResumen, { align: 'right' });
  } else if (saldoAFavorMostrar > 0) {
    // Cliente tiene saldo a favor (por total_pendiente negativo o por saldo inicial)
    doc.text('Saldo a Favor:', 15, yResumen);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 167, 69); // Verde
    doc.text(formatearMonedaConSimbolo(saldoAFavorMostrar), 195, yResumen, { align: 'right' });
  } else {
    // Está al día
    doc.text('Saldo:', 15, yResumen);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 167, 69); // Verde
    doc.text(formatearMonedaConSimbolo(0), 195, yResumen, { align: 'right' });
  }
  
  // Pie de página profesional
  const pieY = doc.internal.pageSize.height - 15;
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(`Documento generado el ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })}`, 105, pieY, { align: 'center' });
  
  // Línea decorativa en el pie
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.1);
  doc.line(50, pieY - 5, 160, pieY - 5);

  // Guardar
  doc.save(`Cuenta_Corriente_${cliente.nombre.replace(/\s/g, '_')}.pdf`);
};

export const exportResumenGeneralPDF = async (deudasClientes) => {
  if (!deudasClientes || deudasClientes.length === 0) {
    throw new Error('No hay datos de deudas para exportar');
  }
  
  const doc = new jsPDF();
  
  const clientesConDeuda = deudasClientes.filter(c => (c.deuda || 0) > 0);
  const totalDeuda = clientesConDeuda.reduce((sum, c) => sum + (c.deuda || 0), 0);
  
  if (clientesConDeuda.length === 0) {
    throw new Error('No hay clientes con deuda para exportar');
  }
  
  // Título - Celeste
  doc.setFillColor(52, 152, 219);
  doc.rect(0, 0, 210, 18, 'F');
  doc.setTextColor(255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE DE DEUDAS', 10, 12);
  doc.setFontSize(10);
  doc.text(new Date().toLocaleDateString('es-AR'), 200, 12, { align: 'right' });
  
  // Tabla simple - 1 cliente por fila
  doc.autoTable({
    startY: 22,
    head: [['Cliente', 'Debe']],
    body: clientesConDeuda.map(c => [c.nombre, formatearMonedaConSimbolo(c.deuda)]),
    margin: { left: 10, right: 10 },
    styles: { 
      fontSize: 9, 
      cellPadding: 3
    },
    headStyles: { 
      fillColor: [52, 152, 219], 
      fontStyle: 'bold',
      fontSize: 10
    },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 50, halign: 'right', fontStyle: 'bold' }
    },
    alternateRowStyles: { fillColor: [240, 248, 255] }
  });
  
  // Total al final - Rosado
  const finalY = doc.lastAutoTable.finalY + 3;
  doc.setFillColor(255, 182, 193);
  doc.rect(5, finalY, 200, 10, 'F');
  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL DEUDA:', 10, finalY + 7);
  doc.text(formatearMonedaConSimbolo(totalDeuda), 200, finalY + 7, { align: 'right' });

  doc.save('Deudas.pdf');
};

