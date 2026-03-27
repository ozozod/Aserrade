export const sumarSaldoAFavorAplicado = (pagos = []) => {
  if (!Array.isArray(pagos)) return 0;
  let suma = 0;
  for (const p of pagos) {
    const obs = String(p?.observaciones || '').toLowerCase();
    if (obs.includes('saldo a favor aplicado')) {
      const monto = parseFloat(p?.monto || 0) || 0;
      // Guardar como positivo aunque en algún caso venga con signo raro
      suma += Math.abs(monto);
    }
  }
  return suma;
};

export const calcularTotalesCuentaCorriente = ({
  totalRemitos = 0,
  totalPagado = 0,
  saldoInicialMonto = 0,
  pagos = []
} = {}) => {
  const montoSI = parseFloat(saldoInicialMonto || 0) || 0;

  // Convención de signo:
  // - montoSI > 0 => crédito a favor (reduce deuda)
  // - montoSI < 0 => deuda inicial (aumenta deuda)
  const creditoInicial = Math.max(0, montoSI);
  const deudaInicial = Math.max(0, -montoSI);

  // MODO MANUAL:
  // El saldo inicial NO se descuenta automáticamente del DEBE.
  // Solo se descuenta lo que esté efectivamente aplicado mediante movimientos "Saldo a favor aplicado".
  const aplicado = sumarSaldoAFavorAplicado(pagos);
  const creditoRestante = Math.max(0, creditoInicial - aplicado);

  const totalPendiente = (parseFloat(totalRemitos || 0) || 0)
    - (parseFloat(totalPagado || 0) || 0)
    - aplicado
    + deudaInicial;

  return {
    total_remitos: parseFloat(totalRemitos || 0) || 0,
    total_pagado: parseFloat(totalPagado || 0) || 0,
    total_pendiente: totalPendiente,
    meta: {
      creditoInicial,
      deudaInicial,
      creditoRestante,
      aplicadoSaldoAFavor: aplicado
    }
  };
};

