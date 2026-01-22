import React from 'react';
import { reportError } from '../services/errorReportingService';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el estado para que la próxima renderización muestre la UI de error
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Reporta el error a Supabase
    reportError(error, {
      componentName: this.props.componentName || 'ErrorBoundary',
      errorInfo: errorInfo,
      props: this.props,
      errorBoundary: true
    });

    // Guarda el error y la información del error en el estado
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // También loguea el error en la consola
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Puedes renderizar cualquier UI de error personalizada
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '8px',
          margin: '20px',
          border: '1px solid #f5c6cb'
        }}>
          <h2 style={{ color: '#721c24', marginBottom: '20px' }}>⚠️ Algo salió mal</h2>
          <p style={{ marginBottom: '20px' }}>
            Ha ocurrido un error inesperado. El error ha sido reportado automáticamente.
          </p>
          <p style={{ fontSize: '14px', color: '#856404', marginBottom: '20px' }}>
            Por favor, recarga la página o contacta al soporte técnico si el problema persiste.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null, errorInfo: null });
              window.location.reload();
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🔄 Recargar Página
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '20px', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>Detalles del error (solo desarrollo)</summary>
              <pre style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '5px',
                overflow: 'auto',
                fontSize: '12px',
                color: '#212529'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

