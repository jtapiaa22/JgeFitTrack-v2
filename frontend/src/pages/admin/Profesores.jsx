import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Profesores() {
  const navigate = useNavigate();
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfesores();
  }, []);

  const loadProfesores = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/clientes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const soloProfs = response.data.filter(c => c.rol === 'profesor');
      setProfesores(soloProfs);
    } catch (error) {
      console.error('Error cargando profesores:', error);
      alert('Error al cargar los profesores.');
    } finally {
      setLoading(false);
    }
  };

  const toggleActivo = async (id, activoActual) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:3001/api/clientes/${id}/toggle-activo`,
        { activo: !activoActual },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadProfesores();
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error al cambiar el estado del profesor.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este profesor? Se eliminarán también todos sus alumnos y datos.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:3001/api/clientes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        loadProfesores();
      } catch (error) {
        console.error('Error eliminando profesor:', error);
        alert('Error al eliminar profesor.');
      }
    }
  };

  const handleExtenderPrueba = async (id) => {
    const dias = prompt('¿Cuántos días quieres extender el período de prueba?', '30');
    if (!dias || isNaN(dias)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:3001/api/clientes/${id}/extender-prueba`,
        { dias: parseInt(dias) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Período de prueba extendido por ${dias} días`);
      loadProfesores();
    } catch (error) {
      console.error('Error extendiendo prueba:', error);
      alert('Error al extender período de prueba');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '40px' }}>Cargando...</div>;

  return (
    <div style={styles.page}>
      {/* Encabezado */}
      <div style={styles.header}>
        <h1 style={styles.title}>Gestión de Profesores</h1>
        <button
          style={styles.addBtn}
          onClick={() => navigate('/admin/profesores/nuevo')}
        >
          + Nuevo Profesor
        </button>
      </div>

      {/* Tabla */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Nombre</th>
              <th style={styles.th}>Usuario</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>DNI</th>
              <th style={styles.th}>Fecha Registro</th>
              <th style={styles.th}>Estado</th>
              <th style={styles.th}>Suscripción</th>
              <th style={styles.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {profesores.map(profesor => {
              const enPrueba = profesor.en_prueba;
              const fechaPruebaFin = profesor.fecha_prueba_fin ? new Date(profesor.fecha_prueba_fin) : null;
              const pruebaVencida = fechaPruebaFin && new Date() > fechaPruebaFin;
              const diasRestantes = fechaPruebaFin
                ? Math.ceil((fechaPruebaFin - new Date()) / (1000 * 60 * 60 * 24))
                : 0;

              return (
                <tr key={profesor.id} style={!profesor.activo ? styles.trInactivo : styles.trNormal}>
                  <td style={styles.td}>{profesor.id}</td>
                  <td style={styles.td}>{profesor.nombre}</td>
                  <td style={styles.td}>{profesor.usuario}</td>
                  <td style={styles.td}>{profesor.email}</td>
                  <td style={styles.td}>{profesor.dni}</td>
                  <td style={styles.td}>
                    {profesor.fecha_registro
                      ? new Date(profesor.fecha_registro).toLocaleDateString()
                      : '-'}
                  </td>
                  <td style={styles.td}>
                    <span style={profesor.activo ? styles.badgeActivo : styles.badgeInactivo}>
                      {profesor.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>

                  <td style={styles.td}>
                    {enPrueba ? (
                      <div>
                        <span style={pruebaVencida ? styles.badgePruebaVencida : styles.badgePrueba}>
                          {pruebaVencida ? '⏰ Prueba Vencida' : '🎁 En Prueba'}
                        </span>
                        <br />
                        <small style={{ color: pruebaVencida ? '#e74c3c' : '#7f8c8d' }}>
                          {pruebaVencida
                            ? `Venció el ${fechaPruebaFin.toLocaleDateString()}`
                            : `${diasRestantes} días restantes`}
                        </small>
                      </div>
                    ) : (
                      <span style={styles.badgeSuscripcion}>💳 Suscripción</span>
                    )}
                  </td>

                  <td style={styles.td}>
                    <div style={styles.actionGroup}>
                      <button
                        onClick={() => toggleActivo(profesor.id, profesor.activo)}
                        style={profesor.activo ? styles.btnDesactivar : styles.btnActivar}
                      >
                        {profesor.activo ? 'Desactivar' : 'Activar'}
                      </button>

                      {enPrueba && (
                        <button
                          onClick={() => handleExtenderPrueba(profesor.id)}
                          style={styles.btnExtender}
                        >
                          + Extender
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(profesor.id)}
                        style={styles.btnEliminar}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {profesores.length === 0 && (
          <p style={styles.noData}>No hay profesores registrados.</p>
        )}
      </div>
    </div>
  );
}

// 🎨 Estilos visuales mejorados
const styles = {
  page: {
    backgroundColor: '#f7f9fa',
    minHeight: '100vh',
    padding: '20px 30px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: '15px 25px',
    borderRadius: '8px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    marginBottom: '25px'
  },
  title: {
    margin: 0,
    color: '#2c3e50',
    fontSize: '22px',
    fontWeight: '600'
  },
  addBtn: {
    padding: '10px 20px',
    backgroundColor: '#2ecc71',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background 0.3s',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '25px',
    boxShadow: '0 3px 8px rgba(0,0,0,0.08)',
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '2px solid #e0e0e0',
    backgroundColor: '#f9fafb',
    color: '#2c3e50',
    fontSize: '14px',
    fontWeight: '600'
  },
  td: {
    padding: '14px 12px',
    borderBottom: '1px solid #eee',
    fontSize: '14px',
    color: '#34495e'
  },
  trNormal: {
    transition: 'background 0.2s',
  },
  trInactivo: {
    backgroundColor: '#fdf1f1',
    opacity: 0.8
  },
  badgeActivo: {
    backgroundColor: '#27ae60',
    color: '#fff',
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  badgeInactivo: {
    backgroundColor: '#e74c3c',
    color: '#fff',
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  badgePrueba: {
    backgroundColor: '#3498db',
    color: 'white',
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  badgePruebaVencida: {
    backgroundColor: '#e74c3c',
    color: 'white',
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  badgeSuscripcion: {
    backgroundColor: '#9b59b6',
    color: 'white',
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  actionGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  btnActivar: {
    backgroundColor: '#2ecc71',
    color: 'white',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'background 0.3s'
  },
  btnDesactivar: {
    backgroundColor: '#f39c12',
    color: 'white',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'background 0.3s'
  },
  btnExtender: {
    backgroundColor: '#2980b9',
    color: 'white',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'background 0.3s'
  },
  btnEliminar: {
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'background 0.3s'
  },
  noData: {
    textAlign: 'center',
    padding: '25px',
    color: '#7f8c8d',
    fontStyle: 'italic'
  }
};

export default Profesores;
