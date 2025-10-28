import { useState, useEffect } from 'react';
import { alumnosService } from '../services/api';

function Alumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  
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
      
      if (editMode && editId) {
        // EDITAR
        await alumnosService.update(editId, formData);
        alert('✅ Alumno actualizado correctamente');
      } else {
        // CREAR
        await alumnosService.create({
          ...formData,
          id_cliente: user.id
        });
        alert('✅ Alumno creado correctamente');
      }
      
      setShowForm(false);
      resetForm();
      loadAlumnos();
    } catch (error) {
      console.error('Error guardando alumno:', error);
      alert('❌ Error al guardar alumno');
    }
  };

  const resetForm = () => {
    setEditMode(false);
    setEditId(null);
    setFormData({
      dni: '',
      nombre: '',
      sexo: 'M',
      fecha_nacimiento: '',
      contacto: '',
      notas: ''
    });
  };

  const handleEdit = (alumno) => {
    setEditMode(true);
    setEditId(alumno.id);
    setFormData({
      dni: alumno.dni,
      nombre: alumno.nombre,
      sexo: alumno.sexo,
      fecha_nacimiento: alumno.fecha_nacimiento.split('T')[0],
      contacto: alumno.contacto || '',
      notas: alumno.notas || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este alumno? Se eliminarán también sus mediciones y pagos.')) {
      try {
        await alumnosService.delete(id);
        alert('✅ Alumno eliminado correctamente');
        loadAlumnos();
      } catch (error) {
        console.error('Error eliminando alumno:', error);
        alert('❌ Error al eliminar alumno');
      }
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <div style={styles.header}>
        <h1>Gestión de Alumnos</h1>
        <button 
          onClick={() => {
            if (showForm) {
              resetForm();
            }
            setShowForm(!showForm);
          }} 
          style={styles.addBtn}
        >
          {showForm ? 'Cancelar' : '+ Nuevo Alumno'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3>{editMode ? '✏️ Editar Alumno' : '➕ Nuevo Alumno'}</h3>
          
          {editMode && (
            <div style={styles.infoBox}>
              <strong>ℹ️ Editando alumno:</strong> {formData.nombre}
            </div>
          )}

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
            placeholder="Contacto (email o teléfono)"
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
          <button type="submit" style={styles.submitBtn}>
            {editMode ? '💾 Actualizar Alumno' : '➕ Guardar Alumno'}
          </button>
        </form>
      )}

      <div style={styles.tableContainer}>
        {alumnos.length === 0 ? (
          <p style={{textAlign: 'center', padding: '40px', color: '#7f8c8d'}}>
            No tienes alumnos registrados. Haz clic en "+ Nuevo Alumno" para agregar uno.
          </p>
        ) : (
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
                  <td style={styles.td}>{alumno.contacto || '-'}</td>
                  <td style={styles.td}>
                    <button 
                      onClick={() => handleEdit(alumno)} 
                      style={styles.editBtn}
                    >
                      ✏️ Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(alumno.id)} 
                      style={styles.deleteBtn}
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
  infoBox: {
    backgroundColor: '#e8f5e9',
    border: '1px solid #4caf50',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    color: '#2e7d32',
    fontSize: '14px'
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
  editBtn: {
    padding: '6px 12px',
    backgroundColor: '#f39c12',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    marginRight: '8px'
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
