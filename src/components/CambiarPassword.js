import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

function CambiarPassword({ usuario, onClose, onSuccess }) {
  const { theme } = useTheme();
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!passwordActual || !passwordNueva || !passwordConfirmar) {
      setError('Completa todos los campos');
      return;
    }

    if (passwordNueva !== passwordConfirmar) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    if (passwordNueva.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    setLoading(true);
    try {
      // Verificar contraseña actual y cambiar
      if (window.electronAPI && window.electronAPI.invoke) {
        const result = await window.electronAPI.invoke('mysql:cambiarPassword', {
          userId: usuario.id,
          username: usuario.username,
          passwordActual,
          passwordNueva
        });

        if (result.success) {
          onSuccess?.();
          onClose();
        } else {
          setError(result.error || 'Error al cambiar la contraseña');
        }
      } else {
        // Fallback para desarrollo
        if (passwordActual === '123pitufo') {
          onSuccess?.();
          onClose();
        } else {
          setError('Contraseña actual incorrecta');
        }
      }
    } catch (err) {
      console.error('Error cambiando contraseña:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
        borderRadius: '16px',
        padding: '30px',
        width: '100%',
        maxWidth: '450px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '25px'
        }}>
          <h2 style={{
            margin: 0,
            color: theme === 'dark' ? '#e0e0e0' : '#333',
            fontSize: '22px'
          }}>
            🔑 Cambiar Contraseña
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: theme === 'dark' ? '#999' : '#666',
              padding: '0',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: theme === 'dark' ? '#ccc' : '#555',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Contraseña Actual
            </label>
            <input
              type="password"
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
              placeholder="Ingresa tu contraseña actual"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: `2px solid ${theme === 'dark' ? '#444' : '#e0e0e0'}`,
                backgroundColor: theme === 'dark' ? '#3a3a3a' : '#f8f9fa',
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: theme === 'dark' ? '#ccc' : '#555',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Nueva Contraseña
            </label>
            <input
              type="password"
              value={passwordNueva}
              onChange={(e) => setPasswordNueva(e.target.value)}
              placeholder="Ingresa tu nueva contraseña"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: `2px solid ${theme === 'dark' ? '#444' : '#e0e0e0'}`,
                backgroundColor: theme === 'dark' ? '#3a3a3a' : '#f8f9fa',
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: theme === 'dark' ? '#ccc' : '#555',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Confirmar Nueva Contraseña
            </label>
            <input
              type="password"
              value={passwordConfirmar}
              onChange={(e) => setPasswordConfirmar(e.target.value)}
              placeholder="Confirma tu nueva contraseña"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: `2px solid ${theme === 'dark' ? '#444' : '#e0e0e0'}`,
                backgroundColor: theme === 'dark' ? '#3a3a3a' : '#f8f9fa',
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: theme === 'dark' ? 'rgba(220, 53, 69, 0.2)' : '#fff5f5',
              color: '#dc3545',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              ❌ {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                backgroundColor: theme === 'dark' ? '#3a3a3a' : '#e0e0e0',
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: loading ? '#999' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'wait' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {loading ? '⏳ Cambiando...' : '✓ Cambiar Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CambiarPassword;
