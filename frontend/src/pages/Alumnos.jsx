import { useState, useEffect } from 'react';
import { alumnosService } from '../services/api';

function Alumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [alumnosFiltrados, setAlumnosFiltrados] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroSexo, setFiltroSexo] = useState('todos');
  const [ordenamiento, setOrdenamiento] = useState('nombre-asc');

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

  // Aplicar filtros y búsqueda cada vez que cambien
  useEffect(() => {
    aplicarFiltros();
  }, [alumnos, searchTerm, filtroSexo, ordenamiento]);

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

  const calcularEdad = (fecha_nacimiento) => {
    const hoy = new Date();
    const nacimiento = new Date(fecha_nacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes == 0 && hoy.getDate() < nacimiento.getDate())){
      edad--;
    }
    return edad;
  }

  const aplicarFiltros = () => {
    let resultado = [...alumnos];

    // 1. BÚSQUEDA por nombre o DNI
    if (searchTerm.trim() !== '') {
      const termino = searchTerm.toLowerCase();
      resultado = resultado.filter(alumno => 
        alumno.nombre.toLowerCase().includes(termino) ||
        alumno.dni.toString().includes(termino)
      );
    }

    // 2. FILTRO por sexo
    if (filtroSexo !== 'todos') {
      resultado = resultado.filter(alumno => alumno.sexo === filtroSexo);
    }

    // 3. ORDENAMIENTO
    resultado.sort((a, b) => {
      switch(ordenamiento) {
        case 'nombre-asc':
          return a.nombre.localeCompare(b.nombre);
        case 'nombre-desc':
          return b.nombre.localeCompare(a.nombre);
        case 'edad-asc':
          return calcularEdad(a.fecha_nacimiento) - calcularEdad(b.fecha_nacimiento);
        case 'edad-desc':
          return calcularEdad(b.fecha_nacimiento) - calcularEdad(a.fecha_nacimiento);
        case 'reciente':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'antiguo':
          return new Date(a.created_at) - new Date(b.created_at);
        default:
          return 0;
      }
    });

    setAlumnosFiltrados(resultado);
  };

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFiltroSexo('todos');
    setOrdenamiento('nombre-asc');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const payload = {
        ...formData,
        id_cliente: user.id
      };

      if (editMode && editId) {
        await alumnosService.update(editId, payload);
        alert('✅ Alumno actualizado correctamente');
      } else {
        await alumnosService.create(payload);
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
    if (window.confirm('⚠️ ¿Estás seguro de eliminar este alumno? Se eliminarán también todas sus mediciones y pagos.')) {
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

  const hayFiltrosActivos = searchTerm !== '' || filtroSexo !== 'todos' || ordenamiento !== 'nombre-asc';

  return (
    <div>
      <h1>Gestión de Alumnos</h1>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div style={styles.filtersContainer}>
        <div style={styles.searchBar}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={styles.clearSearchBtn}>
              ✕
            </button>
          )}
        </div>

        <div style={styles.filtersRow}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Sexo:</label>
            <select
              value={filtroSexo}
              onChange={(e) => setFiltroSexo(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="todos">Todos</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Ordenar por:</label>
            <select
              value={ordenamiento}
              onChange={(e) => setOrdenamiento(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="nombre-asc">Nombre (A-Z)</option>
              <option value="nombre-desc">Nombre (Z-A)</option>
              <option value="edad-asc">Edad (menor a mayor)</option>
              <option value="edad-desc">Edad (mayor a menor)</option>
              <option value="reciente">Más recientes</option>
              <option value="antiguo">Más antiguos</option>
            </select>
          </div>

          {hayFiltrosActivos && (
            <button onClick={limpiarFiltros} style={styles.clearFiltersBtn}>
              🔄 Limpiar filtros
            </button>
          )}
        </div>

        <div style={styles.resultsInfo}>
          <span>
            Mostrando <strong>{alumnosFiltrados.length}</strong> de <strong>{alumnos.length}</strong> alumnos
          </span>
        </div>
      </div>

      {/* BOTÓN AGREGAR */}
      <div style={styles.header}>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            }
            setShowForm(!showForm);
          }}
          style={styles.addBtn}
        >
          {showForm ? 'Cancelar' : '+ Agregar Alumno'}
        </button>
      </div>

      {/* FORMULARIO */}
      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3>{editMode ? '✏️ Editar Alumno' : '➕ Agregar Nuevo Alumno'}</h3>

          {editMode && (
            <div style={styles.infoBox}>
              <strong>ℹ️ Editando alumno:</strong> {formData.nombre}
            </div>
          )}

          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>DNI: *</label>
              <input
                type="text"
                value={formData.dni}
                onChange={(e) => setFormData({...formData, dni: e.target.value})}
                style={styles.input}
                required
                disabled={editMode}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Nombre completo: *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Sexo: *</label>
              <select
                value={formData.sexo}
                onChange={(e) => setFormData({...formData, sexo: e.target.value})}
                style={styles.input}
                required
              >
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Fecha de Nacimiento: *</label>
              <input
                type="date"
                value={formData.fecha_nacimiento}
                onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})}
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Contacto:</label>
            <input
              type="text"
              value={formData.contacto}
              onChange={(e) => setFormData({...formData, contacto: e.target.value})}
              style={styles.input}
              placeholder="Teléfono, email, etc."
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Notas:</label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({...formData, notas: e.target.value})}
              style={{...styles.input, minHeight: '80px'}}
              placeholder="Observaciones adicionales..."
            />
          </div>

          <button type="submit" style={styles.submitBtn}>
            {editMode ? '💾 Actualizar Alumno' : '➕ Agregar Alumno'}
          </button>
        </form>
      )}

      {/* TABLA DE ALUMNOS */}
      <div style={styles.tableContainer}>
        {alumnosFiltrados.length === 0 ? (
          <p style={styles.noResults}>
            {searchTerm || filtroSexo !== 'todos' 
              ? '🔍 No se encontraron alumnos con los filtros aplicados' 
              : 'No hay alumnos registrados'}
          </p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>DNI</th>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Sexo</th>
                <th style={styles.th}>Edad</th>
                <th style={styles.th}>Fecha Nac.</th>
                <th style={styles.th}>Contacto</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {alumnosFiltrados.map(alumno => (
                <tr key={alumno.id}>
                  <td style={styles.td}>{alumno.dni}</td>
                  <td style={styles.td}><strong>{alumno.nombre}</strong></td>
                  <td style={styles.td}>{alumno.sexo === 'M' ? '♂️ M' : '♀️ F'}</td>
                  <td style={styles.td}>{calcularEdad(alumno.fecha_nacimiento)} años</td>
                  <td style={styles.td}>{new Date(alumno.fecha_nacimiento).toLocaleDateString()}</td>
                  <td style={styles.td}>{alumno.contacto || '-'}</td>
                  <td style={styles.td}>
                    <button onClick={() => handleEdit(alumno)} style={styles.editBtn}>
                      ✏️ Editar
                    </button>
                    <button onClick={() => handleDelete(alumno.id)} style={styles.deleteBtn}>
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
  filtersContainer: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  searchBar: {
    position: 'relative',
    marginBottom: '15px'
  },
  searchInput: {
    width: '100%',
    padding: '12px 40px 12px 12px',
    fontSize: '16px',
    border: '2px solid #3498db',
    borderRadius: '8px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.3s'
  },
  clearSearchBtn: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: '#95a5a6',
    cursor: 'pointer',
    padding: '5px',
    lineHeight: '1'
  },
    filtersRow: {
    display: 'flex',
    gap: '15px',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    marginBottom: '15px'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: '200px'
  },
  filterLabel: {
    fontSize: '13px',
    fontWeight: 'bold',
    marginBottom: '5px',
    color: '#2c3e50'
  },
  filterSelect: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    outline: 'none'
  },
  clearFiltersBtn: {
    padding: '8px 16px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap'
  },
  resultsInfo: {
    fontSize: '14px',
    color: '#7f8c8d',
    padding: '10px',
    backgroundColor: '#ecf0f1',
    borderRadius: '4px',
    textAlign: 'center'
  },
  noResults: {
    textAlign: 'center',
    padding: '40px',
    color: '#7f8c8d',
    fontSize: '16px'
  },
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
    padding: '30px',
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
  formGroup: {
    marginBottom: '15px',
    flex: 1
  },
  row: {
    display: 'flex',
    gap: '15px',
    marginBottom: '15px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  submitBtn: {
    padding: '12px 30px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '2px solid #ddd',
    backgroundColor: '#f8f9fa',
    fontSize: '13px'
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #ddd',
    fontSize: '14px'
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

