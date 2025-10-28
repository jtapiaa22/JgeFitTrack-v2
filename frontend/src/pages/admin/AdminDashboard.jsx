import { useState, useEffect } from 'react';
import axios from 'axios';
import { suscripcionesService } from '../../services/api';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProfesores: 0,
    profesoresActivos: 0,
    profesoresEnPrueba: 0,
    totalAlumnos: 0,
    ingresosPagosAlumnos: 0,
    ingresosSuscripciones: 0,
    ingresosTotales: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Obtener estadísticas básicas del backend
      const statsResponse = await axios.get('http://localhost:3001/api/clientes/estadisticas', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Obtener ingresos de suscripciones
      const suscripcionesResponse = await suscripcionesService.getAll();
      const ingresosSuscripciones = suscripcionesResponse.data.reduce(
        (sum, sub) => sum + parseFloat(sub.monto || 0), 
        0
      );
      
      // Calcular totales
      const ingresosPagosAlumnos = statsResponse.data.ingresosTotales;
      const ingresosTotales = ingresosPagosAlumnos + ingresosSuscripciones;
      
      setStats({
        totalProfesores: statsResponse.data.totalProfesores,
        profesoresActivos: statsResponse.data.profesoresActivos,
        profesoresEnPrueba: statsResponse.data.profesoresEnPrueba || 0,
        totalAlumnos: statsResponse.data.totalAlumnos,
        ingresosPagosAlumnos: ingresosPagosAlumnos,
        ingresosSuscripciones: ingresosSuscripciones,
        ingresosTotales: ingresosTotales
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>Cargando estadísticas...</div>;

  return (
    <div>
      <h1>Panel de Administración</h1>
      <p style={{color: '#7f8c8d', marginBottom: '30px'}}>
        Vista general del negocio
      </p>

      {/* Sección de Ingresos */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>💰 Resumen Financiero</h2>
        <div style={styles.statsContainer}>
          <div style={{...styles.statCard, ...styles.cardPurple}}>
            <h3>Ingresos Totales</h3>
            <p style={styles.statNumber}>${stats.ingresosTotales.toFixed(2)}</p>
            <small>Suscripciones + Pagos de alumnos</small>
          </div>

          <div style={{...styles.statCard, ...styles.cardBlue}}>
            <h3>Suscripciones</h3>
            <p style={styles.statNumber}>${stats.ingresosSuscripciones.toFixed(2)}</p>
            <small>Pagos de profesores hacia ti</small>
          </div>

          <div style={{...styles.statCard, ...styles.cardGreen}}>
            <h3>Pagos de Alumnos</h3>
            <p style={styles.statNumber}>${stats.ingresosPagosAlumnos.toFixed(2)}</p>
            <small>Todos los profesores</small>
          </div>
        </div>
      </div>

      {/* Sección de Usuarios */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>👥 Usuarios del Sistema</h2>
        <div style={styles.statsContainer}>
          <div style={{...styles.statCard, ...styles.cardOrange}}>
            <h3>Total Profesores</h3>
            <p style={styles.statNumber}>{stats.totalProfesores}</p>
            <small>{stats.profesoresActivos} activos</small>
          </div>

          <div style={{...styles.statCard, ...styles.cardCyan}}>
            <h3>Profesores Activos</h3>
            <p style={styles.statNumber}>{stats.profesoresActivos}</p>
            <small>Habilitados en el sistema</small>
          </div>

          <div style={{...styles.statCard, ...styles.cardYellow}}>
            <h3>Profesores en Prueba</h3>
            <p style={styles.statNumber}>{stats.profesoresEnPrueba}</p>
            <small>Con período de prueba activo</small>
          </div>

          <div style={{...styles.statCard, ...styles.cardTeal}}>
            <h3>Total Alumnos</h3>
            <p style={styles.statNumber}>{stats.totalAlumnos}</p>
            <small>De todos los profesores</small>
          </div>
        </div>
      </div>

      {/* Acceso Rápido */}
      <div style={styles.infoSection}>
        <h2>🚀 Acceso rápido</h2>
        <div style={styles.quickLinks}>
          <a href="/admin/profesores" style={styles.quickLink}>
            <div style={styles.quickLinkIcon}>📋</div>
            <div style={styles.quickLinkText}>Gestionar Profesores</div>
            <small style={styles.quickLinkDesc}>Ver, editar y administrar</small>
          </a>
          <a href="/admin/suscripciones" style={styles.quickLink}>
            <div style={styles.quickLinkIcon}>💳</div>
            <div style={styles.quickLinkText}>Suscripciones</div>
            <small style={styles.quickLinkDesc}>Pagos de profesores</small>
          </a>
          <a href="/admin/reportes" style={styles.quickLink}>
            <div style={styles.quickLinkIcon}>📊</div>
            <div style={styles.quickLinkText}>Reportes</div>
            <small style={styles.quickLinkDesc}>Estadísticas detalladas</small>
          </a>
        </div>
      </div>
    </div>
  );
}

const styles = {
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#7f8c8d'
  },
  section: {
    marginBottom: '40px'
  },
  sectionTitle: {
    marginBottom: '20px',
    color: '#2c3e50',
    fontSize: '20px',
    fontWeight: '600'
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  },
  statCard: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center',
    border: '3px solid',
    transition: 'transform 0.3s, box-shadow 0.3s'
  },
  cardBlue: {
    borderColor: '#3498db'
  },
  cardGreen: {
    borderColor: '#27ae60'
  },
  cardOrange: {
    borderColor: '#f39c12'
  },
  cardPurple: {
    borderColor: '#9b59b6'
  },
  cardCyan: {
    borderColor: '#1abc9c'
  },
  cardYellow: {
    borderColor: '#f1c40f'
  },
  cardTeal: {
    borderColor: '#16a085'
  },
  statNumber: {
    fontSize: '48px',
    fontWeight: 'bold',
    margin: '10px 0',
    color: '#2c3e50'
  },
  infoSection: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  quickLinks: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginTop: '20px'
  },
  quickLink: {
    padding: '25px',
    backgroundColor: '#ecf0f1',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#2c3e50',
    textAlign: 'center',
    transition: 'all 0.3s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px'
  },
  quickLinkIcon: {
    fontSize: '48px'
  },
  quickLinkText: {
    fontSize: '16px',
    fontWeight: 'bold'
  },
  quickLinkDesc: {
    fontSize: '12px',
    color: '#7f8c8d'
  }
};

export default AdminDashboard;
