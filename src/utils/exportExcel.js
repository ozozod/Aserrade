import ExcelJS from 'exceljs';
import { formatearMonedaConSimbolo, formatearCantidad, formatearCantidadDecimal } from './formatoMoneda';

// Función para limpiar observaciones de pagos (sin información de remitos)
const limpiarConceptoPago = (observaciones, pago = null) => {
  if (!observaciones) return 'PAGO A CUENTA';
  
  let concepto = observaciones;
  
  // Si tiene REMITOS_DETALLE, solo limpiar el concepto (no extraer remitos)
  if (concepto.includes('REMITOS_DETALLE')) {
    // Limpiar el concepto
    concepto = concepto.split('|')[0].trim();
    concepto = concepto.split('REMITOS_DETALLE')[0].trim();
  }
  
  // Quitar [OCULTO] y texto después
  if (concepto.includes('[OCULTO]')) {
    concepto = 'PAGO A CUENTA';
  }
  
  // Si dice "Pago completo" o "Pago agrupado", simplificar
  if (concepto.toLowerCase().includes('pago completo')) {
    concepto = 'PAGO COMPLETO';
  } else if (concepto.toLowerCase().includes('pago agrupado')) {
    concepto = 'PAGO A CUENTA';
  }
  
  // Limpiar espacios extra y caracteres especiales al final
  concepto = concepto.replace(/\s*\|\s*$/, '').trim();
  
  // Si quedó vacío, poner texto por defecto
  if (!concepto || concepto.length < 2) {
    concepto = 'PAGO A CUENTA';
  }
  
  // NO agregar información de remitos al concepto (solo el detalle del pago)
  
  return concepto;
};

// Estilos comunes
const borderStyle = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } }
};

const headerStyle = {
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF222D41' } },
  font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 },
  alignment: { horizontal: 'center', vertical: 'middle' },
  border: borderStyle
};

const cellStyle = {
  border: borderStyle,
  alignment: { vertical: 'middle' }
};

const moneyStyle = {
  border: borderStyle,
  alignment: { horizontal: 'right', vertical: 'middle' }
};

const pagoRowStyle = {
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } }
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
  return new Date(value).toLocaleDateString('es-AR');
};

// Construye movimientos (remitos/pagos) en el formato usado por la tabla
const construirMovimientosExcel = (remitos, pagos) => {
  const movimientos = [];
  
  // Agregar remitos
  remitos.forEach(remito => {
    const articulos = remito.articulos || [];
    const precioTotal = parseFloat(remito.precio_total || 0);
    
    if (articulos.length > 0) {
      const indexToLetter = (idx) => String.fromCharCode(65 + idx);
      const tieneMultiplesArticulos = articulos.length > 1;
      
      articulos.forEach((articulo, index) => {
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
          cantidad: formatearCantidadDecimal(articulo.cantidad || 0),
          precioUnitario: formatearMonedaConSimbolo(parseFloat(articulo.precio_unitario || 0)),
          total: articulo.precio_total || (articulo.cantidad * articulo.precio_unitario) || 0,
          pago: 0,
          id: remito.id,
          remitoId: remito.id,
          orden: index,
          tieneMultiplesArticulos: tieneMultiplesArticulos,
          numeroBase: numeroBase
        });
      });
    } else {
      movimientos.push({
        tipo: 'remito',
        fecha: new Date(remito.fecha),
        fechaStr: new Date(remito.fecha).toLocaleDateString('es-AR'),
        numero: remito.numero || `REM-${remito.id}`,
        concepto: '-',
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
  
  // Agregar pagos
  const pagosAgrupados = {};
  
  pagos.forEach(pago => {
    const obs = pago.observaciones || '';
    
    // Ignorar pagos ocultos (ya contemplados en pago principal)
    if (obs.includes('[OCULTO]')) return;
    
    if (obs.includes('REMITOS_DETALLE')) {
      try {
        const jsonMatch = obs.match(/REMITOS_DETALLE:(\[.*\])/);
        if (jsonMatch) {
          const remitosDetalle = JSON.parse(jsonMatch[1]);
          const montoTotal = remitosDetalle.reduce((sum, r) => sum + parseFloat(r.monto || 0), 0);
          
          let conceptoBase = limpiarConceptoPago(obs, pago);
          
          pagosAgrupados[pago.id] = {
            fecha: new Date(pago.fecha),
            fechaStr: new Date(pago.fecha).toLocaleDateString('es-AR'),
            concepto: conceptoBase,
            montoTotal: montoTotal,
            id: pago.id,
            es_cheque: pago.es_cheque === 1 || pago.es_cheque === true || pago.es_cheque === '1',
            cheque_rebotado: pago.cheque_rebotado === 1 || pago.cheque_rebotado === true || pago.cheque_rebotado === '1',
            remitosDetalle: remitosDetalle
          };
          return;
        }
      } catch (e) {
        console.warn('Error parseando REMITOS_DETALLE:', e);
      }
    }
    
    // Pago normal
    let conceptoPago = limpiarConceptoPago(obs, pago);
    
    pagosAgrupados[pago.id] = {
      fecha: new Date(pago.fecha),
      fechaStr: new Date(pago.fecha).toLocaleDateString('es-AR'),
      concepto: conceptoPago,
      montoTotal: parseFloat(pago.monto || 0),
      id: pago.id,
      es_cheque: pago.es_cheque === 1 || pago.es_cheque === true || pago.es_cheque === '1',
      cheque_rebotado: pago.cheque_rebotado === 1 || pago.cheque_rebotado === true || pago.cheque_rebotado === '1'
    };
  });
  
  Object.values(pagosAgrupados).forEach(pagoAgrupado => {
    const chequeRebotado = pagoAgrupado.cheque_rebotado === 1 || pagoAgrupado.cheque_rebotado === true || pagoAgrupado.cheque_rebotado === '1';
    const esCheque = pagoAgrupado.es_cheque === 1 || pagoAgrupado.es_cheque === true || pagoAgrupado.es_cheque === '1';
    
    if (pagoAgrupado.montoTotal > 0 || chequeRebotado) {
      let concepto = pagoAgrupado.concepto;
      
      if (chequeRebotado) concepto = `[CHEQUE REBOTADO] ${concepto}`;
      else if (esCheque) concepto = `[CHEQUE] ${concepto}`;
      
      movimientos.push({
        tipo: 'pago',
        fecha: pagoAgrupado.fecha,
        fechaStr: pagoAgrupado.fechaStr,
        numero: '',
        concepto,
        cantidad: '',
        precioUnitario: '',
        total: 0,
        pago: pagoAgrupado.montoTotal,
        id: pagoAgrupado.id,
        orden: 0,
        es_cheque: pagoAgrupado.es_cheque,
        cheque_rebotado: pagoAgrupado.cheque_rebotado
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
  
  movimientos.forEach(mov => {
    mov.clave = mov.tipo === 'remito' ? `remito-${mov.id}-${mov.orden}` : `pago-${mov.id}`;
  });
  
  return movimientos;
};

// Calcula saldos con historial completo y devuelve mapa clave->saldo
const calcularSaldosDesdeHistorialExcel = (movimientosHistorial, saldoResumen) => {
  let saldoAcumulado = 0;
  const saldoPorClave = new Map();
  
  movimientosHistorial.forEach(mov => {
    const chequeRebotado = mov.cheque_rebotado === 1 || mov.cheque_rebotado === true || mov.cheque_rebotado === '1';
    if (!chequeRebotado) {
      saldoAcumulado += mov.total - mov.pago;
    }
    saldoPorClave.set(mov.clave, saldoAcumulado);
  });
  
  const diferenciaSaldo = Math.abs(saldoAcumulado - (saldoResumen || 0));
  if (diferenciaSaldo > 1 && movimientosHistorial.length > 0) {
    const ultimo = movimientosHistorial[movimientosHistorial.length - 1];
    const ultimoEsChequeRebotado = ultimo.cheque_rebotado === 1 || ultimo.cheque_rebotado === true || ultimo.cheque_rebotado === '1';
    if (!ultimoEsChequeRebotado) {
      saldoPorClave.set(ultimo.clave, saldoResumen || saldoAcumulado);
    }
  }
  
  return saldoPorClave;
};

export const exportCuentaCorrienteExcel = async (cliente, cuentaCorriente) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Aserradero App';
  workbook.created = new Date();
  
  const worksheet = workbook.addWorksheet('Cuenta Corriente');
  
  // Configurar anchos de columnas
  worksheet.columns = [
    { key: 'remito', width: 18 },
    { key: 'fecha', width: 12 },
    { key: 'producto', width: 45 }, // Aumentado para incluir detalles de remitos en pagos
    { key: 'cant', width: 18 },
    { key: 'unit', width: 15 },
    { key: 'total', width: 18 },
    { key: 'pagaCta', width: 18 },
    { key: 'debe', width: 18 }
  ];
  
  // ========== TÍTULO ==========
  worksheet.mergeCells('A1:H1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `CUENTA CORRIENTE - ${cliente.nombre}`;
  titleCell.font = { bold: true, size: 16, color: { argb: 'FF222D41' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;
  
  // ========== RANGO DE FECHAS (si existe) ==========
  const rangoFechas = cuentaCorriente.rangoFechas;
  if (rangoFechas && (rangoFechas.desde || rangoFechas.hasta)) {
    worksheet.mergeCells('A2:H2');
    const fechaCell = worksheet.getCell('A2');
    let textoRango = 'Período: ';
    if (rangoFechas.desde) textoRango += formatearFechaYYYYMMDD(rangoFechas.desde);
    else textoRango += 'Inicio';
    textoRango += ' - ';
    if (rangoFechas.hasta) textoRango += formatearFechaYYYYMMDD(rangoFechas.hasta);
    else textoRango += 'Hoy';
    fechaCell.value = textoRango;
    fechaCell.font = { italic: true, size: 10, color: { argb: 'FF666666' } };
    fechaCell.alignment = { horizontal: 'center' };
    worksheet.getRow(2).height = 20;
  }
  
  // ========== DATOS DEL CLIENTE ==========
  let startRow = rangoFechas && (rangoFechas.desde || rangoFechas.hasta) ? 3 : 3;
  worksheet.getCell(`A${startRow}`).value = 'DATOS DEL CLIENTE';
  worksheet.getCell(`A${startRow}`).font = { bold: true, size: 11 };
  
  worksheet.getCell(`A${startRow + 1}`).value = 'Cliente:';
  worksheet.getCell(`A${startRow + 1}`).font = { bold: true };
  worksheet.getCell(`B${startRow + 1}`).value = cliente.nombre;
  
  let currentRow = startRow + 2;
  if (cliente.telefono) {
    worksheet.getCell(`A${currentRow}`).value = 'Teléfono:';
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.getCell(`B${currentRow}`).value = cliente.telefono;
    currentRow++;
  }
  if (cliente.direccion) {
    worksheet.getCell(`A${currentRow}`).value = 'Dirección:';
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.getCell(`B${currentRow}`).value = cliente.direccion;
    currentRow++;
  }
  if (cliente.email) {
    worksheet.getCell(`A${currentRow}`).value = 'Email:';
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.getCell(`B${currentRow}`).value = cliente.email;
    currentRow++;
  }
  
  // ========== PRODUCTOS DEL CLIENTE (ELIMINADO - no se muestran) ==========
  // Los artículos del cliente ya no se incluyen en el Excel
  
  currentRow += 2; // Espacio antes de la tabla principal
  
  // ========== ENCABEZADO DE TABLA ==========
  const headerRow = currentRow;
  const headers = ['REMITO', 'FECHA', 'PRODUCTO', 'CANT.', '$ UNIT.', 'TOTAL', 'PAGA A CTA', 'DEBE'];
  
  headers.forEach((header, index) => {
    const cell = worksheet.getCell(headerRow, index + 1);
    cell.value = header;
    cell.fill = headerStyle.fill;
    cell.font = headerStyle.font;
    cell.alignment = headerStyle.alignment;
    cell.border = headerStyle.border;
  });
  worksheet.getRow(headerRow).height = 22;
  
  // ========== COMBINAR REMITOS Y PAGOS ==========
  const movimientos = [];
  
  // Agregar remitos
  cuentaCorriente.remitos.forEach(remito => {
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
  
  // Agregar pagos - procesar igual que en PDF
  const pagos = cuentaCorriente.pagos || [];
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
          let conceptoBase = limpiarConceptoPago(obs, pago);
          
          pagosAgrupados[pago.id] = {
            fecha: new Date(pago.fecha),
            fechaStr: new Date(pago.fecha).toLocaleDateString('es-AR'),
            concepto: conceptoBase,
            montoTotal: montoTotal,
            id: pago.id,
            es_cheque: pago.es_cheque === 1 || pago.es_cheque === true || pago.es_cheque === '1',
            cheque_rebotado: pago.cheque_rebotado === 1 || pago.cheque_rebotado === true || pago.cheque_rebotado === '1',
            remitosDetalle: remitosDetalle // Guardar detalles para referencia
          };
          return;
        }
      } catch (e) {
        console.warn('Error parseando REMITOS_DETALLE:', e);
      }
    }
    
    // Pago normal o adelanto - mostrar individualmente (sin información de remitos)
    let conceptoPago = limpiarConceptoPago(obs, pago);
    
    pagosAgrupados[pago.id] = {
      fecha: new Date(pago.fecha),
      fechaStr: new Date(pago.fecha).toLocaleDateString('es-AR'),
      concepto: conceptoPago,
      montoTotal: parseFloat(pago.monto || 0),
      id: pago.id,
      es_cheque: pago.es_cheque === 1 || pago.es_cheque === true || pago.es_cheque === '1',
      cheque_rebotado: pago.cheque_rebotado === 1 || pago.cheque_rebotado === true || pago.cheque_rebotado === '1'
    };
  });
  
  Object.values(pagosAgrupados).forEach(pagoAgrupado => {
    // Verificar cheque rebotado (puede venir como 0/1 de la base de datos)
    const chequeRebotado = pagoAgrupado.cheque_rebotado === 1 || pagoAgrupado.cheque_rebotado === true || pagoAgrupado.cheque_rebotado === '1';
    const esCheque = pagoAgrupado.es_cheque === 1 || pagoAgrupado.es_cheque === true || pagoAgrupado.es_cheque === '1';
    
    // Mostrar pagos con monto > 0 O cheques rebotados (deben aparecer aunque tengan monto 0)
    if (pagoAgrupado.montoTotal > 0 || chequeRebotado) {
      // Si es cheque rebotado, agregar indicador al concepto (sin emojis)
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
        cantidad: '',
        precioUnitario: '',
        total: 0,
        pago: pagoAgrupado.montoTotal,
        id: pagoAgrupado.id,
        orden: 0,
        es_cheque: pagoAgrupado.es_cheque,
        cheque_rebotado: pagoAgrupado.cheque_rebotado
      });
    }
  });
  
  // Ordenar cronológicamente
  movimientos.sort((a, b) => {
    const fechaDiff = a.fecha - b.fecha;
    if (fechaDiff !== 0) return fechaDiff;
    if (a.tipo === 'remito' && b.tipo === 'pago') return -1;
    if (a.tipo === 'pago' && b.tipo === 'remito') return 1;
    if (a.id !== b.id) return a.id - b.id;
    return a.orden - b.orden;
  });
  
  // Calcular saldo acumulado (DEBE) - EXCLUYENDO cheques rebotados del cálculo
  let saldoAcumulado = 0;
  let movimientosConSaldo = movimientos.map(mov => {
    // Verificar si es un cheque rebotado
    const chequeRebotado = mov.cheque_rebotado === 1 || mov.cheque_rebotado === true || mov.cheque_rebotado === '1';
    
    // Si NO es un cheque rebotado, afectar el saldo acumulado normalmente
    if (!chequeRebotado) {
      saldoAcumulado += mov.total - mov.pago;
    }
    // Si es un cheque rebotado, NO afectar el saldo acumulado (mantener el saldo anterior)
    
    return { ...mov, saldo: saldoAcumulado };
  });
  
  // Recalcular saldos usando historial completo para que DEBE y resumen coincidan con la cuenta total
  const movimientosHistorial = construirMovimientosExcel(
    cuentaCorriente.remitosHistorico || cuentaCorriente.remitos || [],
    cuentaCorriente.pagosHistorico || cuentaCorriente.pagos || []
  );
  
  const movimientosFiltrados = construirMovimientosExcel(
    cuentaCorriente.remitos || [],
    cuentaCorriente.pagos || []
  );
  
  const saldoPorClave = calcularSaldosDesdeHistorialExcel(
    movimientosHistorial,
    cuentaCorriente.totales?.total_pendiente || 0
  );
  
  movimientosConSaldo = movimientosFiltrados.map(mov => ({
    ...mov,
    saldo: saldoPorClave.has(mov.clave) ? saldoPorClave.get(mov.clave) : mov.total - mov.pago
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
    'FFF0F8FF', // Azul muy claro
    'FFFFFAF0', // Beige muy claro
    'FFF0FFF0', // Verde muy claro
    'FFFFF0F5', // Rosa muy claro
    'FFF5F5FA'  // Gris muy claro
  ];
  
  // ========== DATOS DE LA TABLA ==========
  let dataRow = headerRow + 1;
  
  movimientosConSaldo.forEach((mov, index) => {
    const esPago = mov.tipo === 'pago';
    const row = worksheet.getRow(dataRow);
    
    row.getCell(1).value = mov.numero;
    row.getCell(2).value = mov.fechaStr;
    row.getCell(3).value = mov.concepto;
    row.getCell(4).value = mov.cantidad;
    row.getCell(5).value = mov.precioUnitario;
    row.getCell(6).value = mov.total > 0 ? formatearMonedaConSimbolo(mov.total) : '';
    row.getCell(7).value = esPago ? formatearMonedaConSimbolo(mov.pago) : '';
    row.getCell(8).value = formatearMonedaConSimbolo(mov.saldo);
    
    // Aplicar estilos a cada celda
    for (let col = 1; col <= 8; col++) {
      const cell = row.getCell(col);
      cell.border = borderStyle;
      cell.alignment = { vertical: 'middle' };
      
      // Alineación derecha para columnas numéricas
      if (col >= 4 && col <= 8) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
      
      // Color para filas de pago (verde normal, rojo si cheque rebotado)
      if (esPago) {
        // Verificar cheque rebotado (puede venir como 0/1 de la base de datos)
        const chequeRebotado = mov.cheque_rebotado === 1 || mov.cheque_rebotado === true || mov.cheque_rebotado === '1';
        if (chequeRebotado) {
          // Cheque rebotado - fondo rojo claro, texto rojo
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
          cell.font = { bold: true, color: { argb: 'FFC62828' } };
        } else {
          // Pago normal - verde
          cell.fill = pagoRowStyle.fill;
          if (col === 7) {
            cell.font = { bold: true, color: { argb: 'FF28A745' } };
          }
        }
      }
      
      // Negrita para DEBE
      if (col === 8) {
        cell.font = { bold: true };
      }
      
      // Negrita para TOTAL
      if (col === 6 && mov.total > 0) {
        cell.font = { bold: true };
      }
    }
    
    // Aplicar estilo de agrupación para remitos con múltiples artículos
    if (!esPago && mov.tieneMultiplesArticulos && mov.remitoId) {
      const indicesRemito = remitosConMultiplesArticulos.get(mov.remitoId);
      if (indicesRemito && indicesRemito.includes(index)) {
        // Encontrar el índice del remito en el mapa para asignar color
        let remitoIndex = 0;
        for (const [remitoId, indices] of remitosConMultiplesArticulos.entries()) {
          if (remitoId === mov.remitoId) break;
          remitoIndex++;
        }
        const colorGrupo = coloresGrupo[remitoIndex % coloresGrupo.length];
        
        // Aplicar color de fondo suave a todas las celdas
        for (let col = 1; col <= 8; col++) {
          const cell = row.getCell(col);
          // Solo aplicar si no tiene otro color (como pago)
          if (!cell.fill || cell.fill.type !== 'pattern' || cell.fill.fgColor?.argb === 'FFF8F9FA') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorGrupo } };
          }
        }
        
        // Borde izquierdo más grueso en la primera columna para agrupar visualmente
        const firstCell = row.getCell(1);
        firstCell.border = {
          ...borderStyle,
          left: { style: 'medium', color: { argb: 'FF4682B4' } } // Azul acero
        };
        firstCell.font = { bold: true, color: { argb: 'FF191970' } }; // Azul marino
      }
    } else if (!esPago && index % 2 === 1) {
      // Alternar color de fondo para filas de remito sin múltiples artículos
      for (let col = 1; col <= 8; col++) {
        const cell = row.getCell(col);
        if (!cell.fill || cell.fill.type !== 'pattern') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
        }
      }
    }
    
    dataRow++;
  });
  
  // ========== RESUMEN FINANCIERO ==========
  dataRow += 2;
  
  worksheet.mergeCells(`A${dataRow}:H${dataRow}`);
  const resumenTitle = worksheet.getCell(`A${dataRow}`);
  resumenTitle.value = 'RESUMEN FINANCIERO';
  resumenTitle.font = { bold: true, size: 12, color: { argb: 'FF222D41' } };
  resumenTitle.alignment = { horizontal: 'center' };
  resumenTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F7FA' } };
  resumenTitle.border = borderStyle;
  
  dataRow++;
  
  // Total Facturado
  worksheet.getCell(`A${dataRow}`).value = 'Total Facturado:';
  worksheet.getCell(`A${dataRow}`).font = { bold: true };
  worksheet.getCell(`A${dataRow}`).border = borderStyle;
  worksheet.mergeCells(`B${dataRow}:H${dataRow}`);
  worksheet.getCell(`B${dataRow}`).value = formatearMonedaConSimbolo(cuentaCorriente.totales.total_remitos || 0);
  worksheet.getCell(`B${dataRow}`).alignment = { horizontal: 'right' };
  worksheet.getCell(`B${dataRow}`).font = { bold: true };
  worksheet.getCell(`B${dataRow}`).border = borderStyle;
  
  dataRow++;
  
  // Total Pagado (con detalle de cheques rebotados si existen)
  let totalChequesRebotados = 0;
  if (cuentaCorriente.pagos) {
    cuentaCorriente.pagos.forEach(pago => {
      if (pago.cheque_rebotado && parseFloat(pago.monto || 0) > 0) {
        const obs = pago.observaciones || '';
        if (!(parseFloat(pago.monto || 0) === 0 && obs.includes('REMITOS_DETALLE:'))) {
          totalChequesRebotados += parseFloat(pago.monto || 0);
        }
      }
    });
  }
  
  worksheet.getCell(`A${dataRow}`).value = totalChequesRebotados > 0 ? 'Total Pagado (con cheques rebotados):' : 'Total Pagado:';
  worksheet.getCell(`A${dataRow}`).font = { bold: true };
  worksheet.getCell(`A${dataRow}`).border = borderStyle;
  worksheet.mergeCells(`B${dataRow}:H${dataRow}`);
  worksheet.getCell(`B${dataRow}`).value = formatearMonedaConSimbolo(cuentaCorriente.totales.total_pagado || 0);
  worksheet.getCell(`B${dataRow}`).alignment = { horizontal: 'right' };
  worksheet.getCell(`B${dataRow}`).font = { bold: true, color: { argb: totalChequesRebotados > 0 ? 'FFDC3545' : 'FF28A745' } };
  worksheet.getCell(`B${dataRow}`).border = borderStyle;
  
  // Mostrar detalle de cheques rebotados si existen
  if (totalChequesRebotados > 0) {
    dataRow++;
    worksheet.getCell(`A${dataRow}`).value = '⚠️ Cheques rebotados:';
    worksheet.getCell(`A${dataRow}`).font = { bold: true, color: { argb: 'FFDC3545' } };
    worksheet.getCell(`A${dataRow}`).border = borderStyle;
    worksheet.mergeCells(`B${dataRow}:H${dataRow}`);
    worksheet.getCell(`B${dataRow}`).value = formatearMonedaConSimbolo(totalChequesRebotados);
    worksheet.getCell(`B${dataRow}`).alignment = { horizontal: 'right' };
    worksheet.getCell(`B${dataRow}`).font = { bold: true, color: { argb: 'FFDC3545' } };
    worksheet.getCell(`B${dataRow}`).border = borderStyle;
  }
  
  dataRow++;
  
  // Saldo Pendiente
  worksheet.getCell(`A${dataRow}`).value = 'Saldo Pendiente:';
  worksheet.getCell(`A${dataRow}`).font = { bold: true };
  worksheet.getCell(`A${dataRow}`).border = borderStyle;
  worksheet.mergeCells(`B${dataRow}:H${dataRow}`);
  worksheet.getCell(`B${dataRow}`).value = formatearMonedaConSimbolo(cuentaCorriente.totales.total_pendiente || 0);
  worksheet.getCell(`B${dataRow}`).alignment = { horizontal: 'right' };
  worksheet.getCell(`B${dataRow}`).font = { bold: true, color: { argb: 'FFDC3545' } };
  worksheet.getCell(`B${dataRow}`).border = borderStyle;
  
  dataRow += 2;
  
  // Fecha de generación
  worksheet.getCell(`A${dataRow}`).value = `Generado el: ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR')}`;
  worksheet.getCell(`A${dataRow}`).font = { italic: true, color: { argb: 'FF666666' } };
  
  // ========== GUARDAR ARCHIVO ==========
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Cuenta_Corriente_${cliente.nombre.replace(/\s/g, '_')}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
};

export const exportResumenGeneralExcel = async (deudasClientes) => {
  if (!deudasClientes || deudasClientes.length === 0) {
    throw new Error('No hay datos de deudas para exportar');
  }
  
  const clientesConDeuda = deudasClientes.filter(c => (c.deuda || 0) > 0);
  
  if (clientesConDeuda.length === 0) {
    throw new Error('No hay clientes con deuda para exportar');
  }
  
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Aserradero App';
  workbook.created = new Date();
  
  const sheet = workbook.addWorksheet('Deudas');
  
  sheet.columns = [
    { key: 'cliente', width: 40 },
    { key: 'deuda', width: 25 }
  ];
  
  // Título
  sheet.mergeCells('A1:B1');
  sheet.getCell('A1').value = 'REPORTE DE DEUDAS';
  sheet.getCell('A1').font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' } };
  sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF34495E' } };
  sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 35;
  
  // Fecha
  sheet.mergeCells('A2:B2');
  sheet.getCell('A2').value = `Fecha: ${new Date().toLocaleDateString('es-AR')}`;
  sheet.getCell('A2').font = { size: 11, italic: true };
  sheet.getCell('A2').alignment = { horizontal: 'center' };
  sheet.getRow(2).height = 20;
  
  // Encabezados
  sheet.getCell('A4').value = 'CLIENTE';
  sheet.getCell('B4').value = 'DEUDA';
  ['A4', 'B4'].forEach(cell => {
    sheet.getCell(cell).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    sheet.getCell(cell).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF34495E' } };
    sheet.getCell(cell).alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getCell(cell).border = borderStyle;
  });
  sheet.getRow(4).height = 25;
  
  // Datos - solo clientes con deuda
  let row = 5;
  let totalDeuda = 0;
  
  clientesConDeuda.forEach((cliente, index) => {
    sheet.getCell(`A${row}`).value = cliente.nombre;
    sheet.getCell(`A${row}`).font = { bold: true, size: 11 };
    sheet.getCell(`A${row}`).border = borderStyle;
    
    sheet.getCell(`B${row}`).value = formatearMonedaConSimbolo(cliente.deuda);
    sheet.getCell(`B${row}`).font = { bold: true, size: 12, color: { argb: 'FFDC3545' } };
    sheet.getCell(`B${row}`).alignment = { horizontal: 'right' };
    sheet.getCell(`B${row}`).border = borderStyle;
    
    // Alternar colores
    if (index % 2 === 0) {
      sheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8D7DA' } };
      sheet.getCell(`B${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8D7DA' } };
    }
    
    totalDeuda += cliente.deuda;
    row++;
  });
  
  // Total
  sheet.getCell(`A${row}`).value = 'TOTAL';
  sheet.getCell(`A${row}`).font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
  sheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC3545' } };
  sheet.getCell(`A${row}`).border = borderStyle;
  
  sheet.getCell(`B${row}`).value = formatearMonedaConSimbolo(totalDeuda);
  sheet.getCell(`B${row}`).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  sheet.getCell(`B${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC3545' } };
  sheet.getCell(`B${row}`).alignment = { horizontal: 'right' };
  sheet.getCell(`B${row}`).border = borderStyle;
  sheet.getRow(row).height = 30;
  
  // Guardar
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Reporte_Deudas.xlsx';
  link.click();
  window.URL.revokeObjectURL(url);
};
