import { useState, useEffect } from 'react';
import { alumnosService } from '../services/api';
import AlertaPrueba from '../components/AlertaPrueba';  // AGREGAR ESTA LÍNEA

function Dashboard() {
  const [stats, setStats] = useState({
    totalAlumnos: 0,
    alumnosActivos: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await alumnosService.getByProfesor(user.id);
      
      setStats({
        totalAlumnos: response.data.length,
        alumnosActivos: response.data.length
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <AlertaPrueba />  {/* Esto ahora funcionará */}
      
      <h1>Dashboard</h1>
      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <h3>Total Alumnos</h3>
          <p style={styles.statNumber}>{stats.totalAlumnos}</p>
        </div>
        <div style={styles.statCard}>
          <h3>Alumnos Activos</h3>
          <p style={styles.statNumber}>{stats.alumnosActivos}</p>
        </div>
        <div style={styles.statCard}>
          <h3>Pagos Pendientes</h3>
          <p style={styles.statNumber}>-</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  statsContainer: {
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
    textAlign: 'center'
  },
  statNumber: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#3498db',
    margin: '10px 0'
  }
};

export default Dashboard;
