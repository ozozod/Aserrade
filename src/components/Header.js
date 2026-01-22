import React, { useContext } from 'react';
import { useTheme } from '../context/ThemeContext';
import { UsuarioContext } from '../App';
import './Header.css';

function Header({ onUsuariosClick, onCambiarPassword, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const usuarioLogueado = useContext(UsuarioContext);
  const esAdmin = usuarioLogueado?.rol === 'admin';

  return (
    <header className="header">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div>
          <h1>🏭 Aserradero App</h1>
          <p>Gestión de Remitos y Cuentas Corrientes</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {usuarioLogueado && (
            <>
              <div style={{
                padding: '6px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '20px',
                fontSize: '13px',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>👤</span>
                <span>{usuarioLogueado.nombre_completo || usuarioLogueado.username}</span>
              </div>
              
              {/* Botón Usuarios - Solo para Admin */}
              {esAdmin && (
                <button
                  onClick={onUsuariosClick}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '20px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  👥 Usuarios
                </button>
              )}
              
              {/* Botón Cambiar Contraseña - Para todos */}
              <button
                onClick={onCambiarPassword}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'rgba(255, 193, 7, 0.2)',
                  border: '1px solid rgba(255, 193, 7, 0.4)',
                  borderRadius: '20px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 193, 7, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 193, 7, 0.2)';
                }}
              >
                🔑 Cambiar Contraseña
              </button>
              
              <button
                onClick={onLogout}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'rgba(220, 53, 69, 0.3)',
                  border: '1px solid rgba(220, 53, 69, 0.5)',
                  borderRadius: '20px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.3)';
                }}
              >
                🚪 Salir
              </button>
            </>
          )}
          
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '50%',
              width: '45px',
              height: '45px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '22px',
              transition: 'all 0.3s ease',
              color: 'white'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;