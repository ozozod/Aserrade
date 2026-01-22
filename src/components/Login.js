import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import CambiarPasswordPrimeraVez from './CambiarPasswordPrimeraVez';

function Login({ onLogin }) {
  const { theme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarCambiarPassword, setMostrarCambiarPassword] = useState(false);
  const [usuarioTemporal, setUsuarioTemporal] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Llamar al servicio de autenticación
      if (window.electronAPI && window.electronAPI.invoke) {
        const result = await window.electronAPI.invoke('mysql:login', { username, password });
        
        if (result.success) {
          // Si debe cambiar contraseña, mostrar modal en lugar de hacer login
          if (result.usuario.debe_cambiar_contraseña) {
            setUsuarioTemporal(result.usuario);
            setMostrarCambiarPassword(true);
            setPassword(''); // Limpiar contraseña
          } else {
            onLogin(result.usuario);
          }
        } else {
          setError(result.error || 'Usuario o contraseña incorrectos');
        }
      } else {
        // Fallback para desarrollo web
        if (username === 'ozo' && password === '123pitufo') {
          onLogin({ id: 1, username: 'ozo', nombre_completo: 'Ozo' });
        } else {
          setError('Usuario o contraseña incorrectos');
        }
      }
    } catch (err) {
      console.error('Error en login:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordCambiado = (usuario) => {
    setMostrarCambiarPassword(false);
    setUsuarioTemporal(null);
    onLogin(usuario);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: theme === 'dark' 
        ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
        : 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '380px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '36px'
          }}>
            🪵
          </div>
          <h1 style={{ 
            margin: 0, 
            fontSize: '24px',
            color: theme === 'dark' ? '#e0e0e0' : '#333'
          }}>
            Aserradero App
          </h1>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: theme === 'dark' ? '#ccc' : '#555',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa tu usuario"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '10px',
                border: `2px solid ${theme === 'dark' ? '#444' : '#e0e0e0'}`,
                backgroundColor: theme === 'dark' ? '#3a3a3a' : '#f8f9fa',
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = theme === 'dark' ? '#444' : '#e0e0e0'}
              required
              autoFocus
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
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '10px',
                border: `2px solid ${theme === 'dark' ? '#444' : '#e0e0e0'}`,
                backgroundColor: theme === 'dark' ? '#3a3a3a' : '#f8f9fa',
                color: theme === 'dark' ? '#e0e0e0' : '#333',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = theme === 'dark' ? '#444' : '#e0e0e0'}
              required
            />
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: theme === 'dark' ? 'rgba(220, 53, 69, 0.2)' : '#fff5f5',
              color: '#dc3545',
              marginBottom: '20px',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              background: loading 
                ? '#999' 
                : 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'wait' : 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 15px rgba(52, 152, 219, 0.4)'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(52, 152, 219, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(52, 152, 219, 0.4)';
            }}
          >
            {loading ? '⏳ Iniciando...' : '🔐 Iniciar Sesión'}
          </button>
        </form>
      </div>

      {/* Modal para cambiar contraseña en primer login */}
      {mostrarCambiarPassword && usuarioTemporal && (
        <CambiarPasswordPrimeraVez
          usuario={usuarioTemporal}
          onClose={() => {
            setMostrarCambiarPassword(false);
            setUsuarioTemporal(null);
          }}
          onSuccess={handlePasswordCambiado}
        />
      )}
    </div>
  );
}

export default Login;

