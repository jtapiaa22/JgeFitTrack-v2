import { useState, useEffect } from 'react';

function AlertaPrueba() {
  const [mostrar, setMostrar] = useState(false);
  const [diasRestantes, setDiasRestantes] = useState(0);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.en_prueba && user?.fecha_prueba_fin) {
      const fechaFin = new Date(user.fecha_prueba_fin);
      const ahora = new Date();
      const dias = Math.ceil((fechaFin - ahora) / (1000 * 60 * 60 * 24));
      
      if (dias <= 7) {  // Mostrar alerta si quedan 7 días o menos
        setMostrar(true);
        setDiasRestantes(dias);
      }
    }
  }, []);

  if (!mostrar) return null;

  return (
    <div style={styles.alerta}>
      <div style={styles.contenido}>
        <span style={styles.icono}>⏰</span>
        <div>
          <strong>Período de prueba terminando</strong>
          <p style={styles.mensaje}>
            {diasRestantes > 0 
              ? `Te quedan ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''} de prueba. Contacta al administrador para activar tu suscripción.`
              : 'Tu período de prueba ha finalizado. Contacta al administrador para continuar usando el sistema.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  alerta: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  contenido: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  icono: {
    fontSize: '32px'
  },
  mensaje: {
    margin: '5px 0 0 0',
    color: '#856404',
    fontSize: '14px'
  }
};

export default AlertaPrueba;
