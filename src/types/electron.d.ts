export interface ElectronAPI {
  // Clientes
  getClientes: () => Promise<any[]>;
  createCliente: (cliente: any) => Promise<any>;
  updateCliente: (id: number, cliente: any) => Promise<any>;
  deleteCliente: (id: number) => Promise<any>;
  
  // Remitos
  getRemitos: (clienteId?: number | null) => Promise<any[]>;
  createRemito: (remito: any) => Promise<any>;
  updateRemito: (id: number, remito: any) => Promise<any>;
  deleteRemito: (id: number) => Promise<any>;
  
  // Pagos
  getPagos: (remitoId?: number | null) => Promise<any[]>;
  createPago: (pago: any) => Promise<any>;
  
  // Reportes
  getCuentaCorriente: (clienteId: number) => Promise<any>;
  getResumenGeneral: () => Promise<any>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

