import { useState, useEffect } from 'react';
import { alumnosService } from '../services/api';

function Alumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    dni: '',
    nombre: '',
    sexo: 'M',
    fecha_nacimiento: '',
    contacto: '',
    notas: ''
  });

  useEffect(() => {
    loadAlumnos();
  }, []);

  const loadAlumnos = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await alumnosService.getByProfesor(user.id);
      setAlumnos(response.data);
    } catch (error) {
      console.error('Error cargando alumnos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await alumnosService.create({
        ...formData,
        id_cliente: user.id
      });
      setShowForm(false);
      setFormData({
        dni: '',
        nombre: '',
        sexo: 'M',
        fecha_nacimiento: '',
        contacto: '',
        notas: ''
      });
      loadAlumnos();
    } catch (error) {
      console.error('Error creando alumno:', error);
      alert('Error al crear alumno');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este alumno?')) {
      try {
        await alumnosService.delete(id);
        loadAlumnos();
      } catch (error) {
        console.error('Error eliminando alumno:', error);
        alert('Error al eliminar alumno');
      }
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <div style={styles.header}>
        <h1>Gestión de Alumnos</h1>
        <button onClick={() => setShowForm(!showForm)} style={styles.addBtn}>
          {showForm ? 'Cancelar' : '+ Nuevo Alumno'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="DNI"
            value={formData.dni}
            onChange={(e) => setFormData({...formData, dni: e.target.value})}
            style={styles.input}
            required
          />
          <input
            type="text"
            placeholder="Nombre completo"
            value={formData.nombre}
            onChange={(e) => setFormData({...formData, nombre: e.target.value})}
            style={styles.input}
            required
          />
          <select
            value={formData.sexo}
            onChange={(e) => setFormData({...formData, sexo: e.target.value})}
            style={styles.input}
          >
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
          <input
            type="date"
            value={formData.fecha_nacimiento}
            onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})}
            style={styles.input}
            required
          />
          <input
            type="text"
            placeholder="Contacto"
            value={formData.contacto}
            onChange={(e) => setFormData({...formData, contacto: e.target.value})}
            style={styles.input}
          />
          <textarea
            placeholder="Notas adicionales"
            value={formData.notas}
            onChange={(e) => setFormData({...formData, notas: e.target.value})}
            style={{...styles.input, minHeight: '80px'}}
          />
          <button type="submit" style={styles.submitBtn}>Guardar Alumno</button>
        </form>
      )}

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>DNI</th>
              <th style={styles.th}>Nombre</th>
              <th style={styles.th}>Sexo</th>
              <th style={styles.th}>Fecha Nac.</th>
              <th style={styles.th}>Contacto</th>
              <th style={styles.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map(alumno => (
              <tr key={alumno.id}>
                <td style={styles.td}>{alumno.dni}</td>
                <td style={styles.td}>{alumno.nombre}</td>
                <td style={styles.td}>{alumno.sexo}</td>
                <td style={styles.td}>{new Date(alumno.fecha_nacimiento).toLocaleDateString()}</td>
                <td style={styles.td}>{alumno.contacto}</td>
                <td style={styles.td}>
                  <button onClick={() => handleDelete(alumno.id)} style={styles.deleteBtn}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  addBtn: {
    padding: '10px 20px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
    form: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  submitBtn: {
    padding: '10px 20px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%'
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '2px solid #ddd',
    backgroundColor: '#f8f9fa'
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #ddd'
  },
  deleteBtn: {
    padding: '6px 12px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  }
};

export default Alumnos;

