import { useState, useEffect } from 'react';
import axios from 'axios';
import { suscripcionesService, pagosService } from '../../services/api';

function Reportes() {
  const [profesores, setProfesores] = useState([]);
  const [suscripciones, setSuscripciones] = useState([]);
  const [pagosTotales, setPagosTotales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState({
    ingresosSuscripciones: 0,
    ingresosAlumnos: 0,
    totalProfesores: 0,
    totalAlumnos: 0
  });

  useEffect(() => {
    loadReportes();
  }, []);

  const loadReportes = async () => {
    try {
      const token = localStorage.getItem('token');

      // Cargar profesores
      const profResponse = await axios.get('http://localhost:3001/api/clientes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const soloProfs = profResponse.data.filter(c => c.rol === 'profesor');
      setProfesores(soloProfs);

      // Cargar suscripciones
      const subsResponse = await suscripcionesService.getAll();
      setSuscripciones(subsResponse.data);

      // Cargar estadísticas generales
      const statsResponse = await axios.get('http://localhost:3001/api/clientes/estadisticas', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Calcular ingresos de suscripciones
      const ingresosSubs = subsResponse.data.reduce((sum, sub) =>
        sum + parseFloat(sub.monto || 0), 0
      );

      setResumen({
        ingresosSuscripciones: ingresosSubs,
        ingresosAlumnos: statsResponse.data.ingresosTotales,
        totalProfesores: statsResponse.data.totalProfesores,
        totalAlumnos: statsResponse.data.totalAlumnos
      });

    } catch (error) {
      console.error('Error cargando reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando...</div>;

  const ingresosTotales = resumen.ingresosSuscripciones + resumen.ingresosAlumnos;

  return (
    <div>
      <h1>Reportes y Estadísticas</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>
        Análisis general del negocio
      </p>

      {/* Resumen financiero */}
      <div style={styles.section}>
        <h2>Resumen Financiero</h2>
        <div style={styles.statsGrid}>
          <div style={{ ...styles.statCard, borderColor: '#9b59b6' }}>
            <h3>Ingresos Totales</h3>
            <p style={styles.amount}>${ingresosTotales.toFixed(2)}</p>
            <small>Suscripciones + Pagos de alumnos</small>
          </div>
          <div style={{ ...styles.statCard, borderColor: '#3498db' }}>
            <h3>Suscripciones</h3>
            <p style={styles.amount}>${resumen.ingresosSuscripciones.toFixed(2)}</p>
            <small>{suscripciones.length} pagos registrados</small>
          </div>
          <div style={{ ...styles.statCard, borderColor: '#27ae60' }}>
            <h3>Pagos de Alumnos</h3>
            <p style={styles.amount}>${resumen.ingresosAlumnos.toFixed(2)}</p>
            <small>Todos los profesores</small>
          </div>
        </div>
      </div>

      {/* Resumen de usuarios */}
      <div style={styles.section}>
        <h2>Usuarios del Sistema</h2>
        <div style={styles.statsGrid}>
          <div style={{ ...styles.statCard, borderColor: '#f39c12' }}>
            <h3>Total Profesores</h3>
            <p style={styles.amount}>{resumen.totalProfesores}</p>
            <small>{profesores.filter(p => p.activo).length} activos</small>
          </div>

          <div style={{ ...styles.statCard, borderColor: '#e74c3c' }}>
            <h3>Total Alumnos</h3>
            <p style={styles.amount}>{resumen.totalAlumnos}</p>
            <small>De todos los profesores</small>
          </div>

          <div style={{ ...styles.statCard, borderColor: '#1abc9c' }}>
            <h3>Promedio Alumnos/Prof</h3>
            <p style={styles.amount}>
              {resumen.totalProfesores > 0
                ? (resumen.totalAlumnos / resumen.totalProfesores).toFixed(1)
                : 0}
            </p>
            <small>Por profesor activo</small>
          </div>
        </div>
      </div>

      {/* Estado de suscripciones */}
      <div style={styles.section}>
        <h2>Estado de Suscripciones</h2>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Profesor</th>
                <th style={styles.th}>Estado Suscripción</th>
                <th style={styles.th}>Vencimiento</th>
                <th style={styles.th}>Último Pago</th>
              </tr>
            </thead>
            <tbody>
              {profesores.map(profesor => {
                const subsProfesor = suscripciones.filter(s => s.id_cliente === profesor.id);
                const ultimaSub = subsProfesor.sort((a, b) =>
                  new Date(b.fecha_inicio) - new Date(a.fecha_inicio)
                )[0];

                const tieneActiva = subsProfesor.some(s => s.estado === 'activa');

                return (
                  <tr key={profesor.id}>
                    <td style={styles.td}>
                      <strong>{profesor.nombre}</strong><br />
                      <small style={{ color: '#7f8c8d' }}>{profesor.email}</small>
                    </td>
                    <td style={styles.td}>
                      {tieneActiva ? (
                        <span style={styles.badgeActiva}>✓ Activa</span>
                      ) : (
                        <span style={styles.badgeVencida}>✗ Sin suscripción</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      {ultimaSub ? (
                        <>
                          {new Date(ultimaSub.fecha_fin).toLocaleDateString()}
                          <br />
                          <small style={{ color: '#7f8c8d' }}>
                            {new Date(ultimaSub.fecha_fin) > new Date()
                              ? 'Vigente'
                              : 'Vencida'}
                          </small>
                        </>
                      ) : '-'}
                    </td>
                    <td style={styles.td}>
                      {ultimaSub ? (
                        <>
                          ${parseFloat(ultimaSub.monto).toFixed(2)}
                          <br />
                          <small style={{ color: '#7f8c8d' }}>
                            {new Date(ultimaSub.fecha_inicio).toLocaleDateString()}
                          </small>
                        </>
                      ) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ranking de profesores */}
      <div style={styles.section}>
        <h2>Top Profesores por Ingresos</h2>
        <div style={styles.infoBox}>
          <p style={{ color: '#7f8c8d', textAlign: 'center' }}>
            📊 Próximamente: ranking de profesores por cantidad de alumnos e ingresos generados
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  section: { marginBottom: '40px' },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginTop: '20px'
  },
  statCard: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center',
    border: '3px solid'
  },
  amount: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#2c3e50',
    margin: '15px 0'
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginTop: '20px',
    overflowX: 'auto'
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '2px solid #ddd',
    backgroundColor: '#f8f9fa',
    fontSize: '13px',
    fontWeight: 'bold'
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #ddd',
    fontSize: '14px'
  },
  badgeActiva: {
    display: 'inline-block',
    padding: '6px 12px',
    backgroundColor: '#27ae60',
    color: 'white',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  badgeVencida: {
    display: 'inline-block',
    padding: '6px 12px',
    backgroundColor: '#e74c3c',
    color: 'white',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  infoBox: {
    backgroundColor: '#ecf0f1',
    padding: '40px',
    borderRadius: '8px',
    marginTop: '20px'
  }
};

export default Reportes;
