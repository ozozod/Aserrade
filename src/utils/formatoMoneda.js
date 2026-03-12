/**
 * Formatea un número como moneda en formato argentino (con 2 decimales)
 * Ejemplo: 1000000.34 -> "1.000.000,34"
 * @param {number} valor - El valor numérico a formatear
 * @returns {string} - El valor formateado como string con 2 decimales
 */
export const formatearMoneda = (valor) => {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return '0,00';
  }
  
  const numero = parseFloat(valor);
  
  // Formatear con 2 decimales
  const numeroFormateado = Math.abs(numero).toFixed(2);
  
  // Separar parte entera y decimal
  const [parteEntera, parteDecimal] = numeroFormateado.split('.');
  
  // Agregar puntos como separadores de miles a la parte entera
  const parteEnteraFormateada = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Combinar con coma como separador decimal
  return `${parteEnteraFormateada},${parteDecimal}`;
};

/**
 * Formatea un número como moneda con símbolo de peso (con 2 decimales)
 * Ejemplo: 1000000.34 -> "$ 1.000.000,34"
 * @param {number} valor - El valor numérico a formatear
 * @returns {string} - El valor formateado con símbolo de peso con 2 decimales
 */
export const formatearMonedaConSimbolo = (valor) => {
  return `$ ${formatearMoneda(valor)}`;
};

/**
 * Formatea un número con puntos separadores de miles y coma decimal mientras se escribe
 * Ejemplo: "1000000.50" -> "1.000.000,50" o ",09" -> ",09"
 * @param {string} valor - El valor como string (puede tener puntos y coma ya)
 * @returns {string} - El valor formateado con puntos y coma decimal
 */
export const formatearNumeroVisual = (valor) => {
  if (!valor || valor === '') return '';
  
  const valorStr = valor.toString();
  
  // Si empieza con coma (ej: ",09"), mantenerlo así
  if (valorStr.startsWith(',')) {
    const decimales = valorStr.substring(1).replace(/[^\d]/g, '').slice(0, 2);
    return `,${decimales}`;
  }
  
  // Si tiene coma, separar parte entera y decimal
  if (valorStr.includes(',')) {
    const partes = valorStr.split(',');
    let parteEntera = partes[0].replace(/\./g, '').replace(/[^\d]/g, '');
    const parteDecimal = partes[1] ? partes[1].replace(/[^\d]/g, '').slice(0, 2) : '';
    
    // Formatear parte entera con puntos
    const parteEnteraFormateada = parteEntera === '' ? '' : parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    // Combinar
    if (parteDecimal) {
      return `${parteEnteraFormateada},${parteDecimal}`;
    }
    return parteEnteraFormateada ? `${parteEnteraFormateada},` : ',';
  }
  
  // Si no tiene coma, solo formatear parte entera
  const parteEntera = valorStr.replace(/\./g, '').replace(/[^\d]/g, '');
  if (parteEntera === '') return '';
  
  return parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Limpia el formato visual (quita puntos y convierte coma a punto) para obtener el número puro
 * Ejemplo: "1.000.000,50" -> "1000000.50"
 * @param {string} valor - El valor formateado con puntos y coma decimal
 * @returns {string} - El valor sin puntos, con punto como separador decimal
 */
export const limpiarFormatoNumero = (valor) => {
  if (!valor || valor === '') return '';
  // Quitar puntos de miles y convertir coma decimal a punto
  return valor.toString().replace(/\./g, '').replace(',', '.');
};

/**
 * Formatea una cantidad sin decimales (solo parte entera)
 * Ejemplo: 1000 -> "1.000"  o  1000.00 -> "1.000"
 * @param {number} valor - El valor numérico a formatear
 * @returns {string} - El valor formateado sin decimales
 */
export const formatearCantidad = (valor) => {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return '0';
  }
  
  const numero = parseFloat(valor);
  
  // Obtener solo la parte entera
  const parteEntera = Math.floor(Math.abs(numero)).toString();
  
  // Agregar puntos como separadores de miles
  return parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Formatea una cantidad con decimales en formato argentino
 * Ejemplo: 1234.56 -> "1.234,56"
 * @param {number|string} valor - El valor a formatear
 * @returns {string} - El valor formateado
 */
export const formatearCantidadDecimal = (valor) => {
  if (valor === null || valor === undefined || valor === '') {
    return '';
  }
  
  let numero;
  
  // Si es número, usarlo directamente
  if (typeof valor === 'number') {
    numero = valor;
  } else {
    // Si es string, determinar el formato
    const valorStr = valor.toString();
    
    // Si tiene coma, es formato argentino (1.234,56)
    if (valorStr.includes(',')) {
      // Quitar puntos de miles, convertir coma a punto
      numero = parseFloat(valorStr.replace(/\./g, '').replace(',', '.'));
    } else {
      // Es formato internacional (1234.56) o entero
      numero = parseFloat(valorStr);
    }
  }
  
  if (isNaN(numero)) return '';
  
  // Verificar si el número es entero (sin decimales significativos)
  // Usar toFixed para evitar problemas de precisión de punto flotante
  const numeroRedondeado = Math.round(numero * 100) / 100;
  const esEntero = Math.abs(numeroRedondeado % 1) < 0.0001;
  
  if (esEntero) {
    // Si es entero, formatear solo con puntos de miles, sin decimales
    const parteEntera = Math.floor(Math.abs(numeroRedondeado)).toString();
    return parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  } else {
    // Si tiene decimales, formatear con coma decimal
    const numeroStr = numeroRedondeado.toFixed(2); // Limitar a 2 decimales
    const [parteEntera, parteDecimal] = numeroStr.split('.');
    // Quitar ceros finales de los decimales si es necesario
    let decimales = parteDecimal.replace(/0+$/, '');
    if (decimales === '') decimales = '00';
    // Formatear parte entera con puntos de miles
    const parteEnteraFormateada = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${parteEnteraFormateada},${decimales}`;
  }
};

/**
 * Suma los montos de pagos que tienen "Saldo a favor aplicado" en observaciones.
 * Se usa para descontar del saldo a favor mostrado el crédito ya aplicado a remitos.
 * @param {Array} pagos - Lista de pagos (cuentaCorriente.pagos)
 * @returns {number}
 */
const TEXTO_SALDO_FAVOR_APLICADO = 'saldo a favor aplicado';
export const sumarPagosSaldoAFavorAplicado = (pagos) => {
  if (!pagos || !Array.isArray(pagos)) return 0;
  return pagos.reduce((sum, p) => {
    const obs = (p.observaciones || '').toLowerCase();
    if (obs.includes(TEXTO_SALDO_FAVOR_APLICADO)) {
      return sum + (parseFloat(p.monto) || 0);
    }
    return sum;
  }, 0);
};

