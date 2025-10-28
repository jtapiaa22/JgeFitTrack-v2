import { useState, useEffect } from 'react';
import { alumnosService, pagosService } from '../services/api';

function Pagos() {
  const [alumnos, setAlumnos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [selectedAlumno, setSelectedAlumno] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('todos');
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    fecha_pago: new Date().toISOString().split('T')[0],
    periodo_desde: '',
    periodo_hasta: '',
    monto: '',
    metodo_pago: 'efectivo',
    observaciones: ''
  });

  useEffect(() => {
    loadAlumnos();
    loadAllPagos();
  }, []);

  useEffect(() => {
    if (selectedAlumno && viewMode === 'alumno') {
      loadPagosByAlumno(selectedAlumno);
    }
  }, [selectedAlumno, viewMode]);

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

  const loadAllPagos = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await pagosService.getByProfesor(user.id);
      setPagos(response.data);
    } catch (error) {
      console.error('Error cargando pagos:', error);
      setPagos([]);
    }
  };

  const loadPagosByAlumno = async (id_alumno) => {
    try {
      const response = await pagosService.getByAlumno(id_alumno);
      setPagos(response.data);
    } catch (error) {
      console.error('Error cargando pagos del alumno:', error);
      setPagos([]);
    }
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === 'todos') {
      setSelectedAlumno('');
      loadAllPagos();
    }
  };

  const handleAlumnoChange = (e) => {
    const alumnoId = e.target.value;
    setSelectedAlumno(alumnoId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAlumno) {
      alert('Selecciona un alumno');
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const payload = {
        id_alumno: parseInt(selectedAlumno),
        id_profesor: user.id,
        fecha_pago: formData.fecha_pago,
        periodo_desde: formData.periodo_desde,
        periodo_hasta: formData.periodo_hasta,
        monto: parseFloat(formData.monto),
        metodo_pago: formData.metodo_pago,
        observaciones: formData.observaciones
      };

      if (editMode && editId) {
        // EDITAR
        await pagosService.update(editId, payload);
        alert('✅ Pago actualizado correctamente');
      } else {
        // CREAR
        await pagosService.create(payload);
        alert('✅ Pago registrado correctamente');
      }

      setShowForm(false);
      resetForm();
      
      if (viewMode === 'todos') {
        loadAllPagos();
      } else {
        loadPagosByAlumno(selectedAlumno);
      }
    } catch (error) {
      console.error('Error guardando pago:', error);
      alert('❌ Error al guardar pago');
    }
  };

  const resetForm = () => {
    setEditMode(false);
    setEditId(null);
    setFormData({
      fecha_pago: new Date().toISOString().split('T')[0],
      periodo_desde: '',
      periodo_hasta: '',
      monto: '',
      metodo_pago: 'efectivo',
      observaciones: ''
    });
  };

  const handleEdit = (pago) => {
    setEditMode(true);
    setEditId(pago.id);
    setSelectedAlumno(pago.id_alumno);
    setFormData({
      fecha_pago: pago.fecha_pago.split('T')[0],
      periodo_desde: pago.periodo_desde ? pago.periodo_desde.split('T')[0] : '',
      periodo_hasta: pago.periodo_hasta ? pago.periodo_hasta.split('T')[0] : '',
      monto: pago.monto,
      metodo_pago: pago.metodo_pago,
      observaciones: pago.observaciones || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este pago?')) {
      try {
        await pagosService.delete(id);
        alert('✅ Pago eliminado correctamente');
        if (viewMode === 'todos') {
          loadAllPagos();
        } else {
          loadPagosByAlumno(selectedAlumno);
        }
      } catch (error) {
        console.error('Error eliminando pago:', error);
        alert('❌ Error al eliminar pago');
      }
    }
  };

  const calcularTotal = () => {
    return pagos.reduce((sum, pago) => sum + parseFloat(pago.monto || 0), 0).toFixed(2);
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h1>Gestión de Pagos</h1>

      <div style={styles.viewModeSelector}>
        <button
          onClick={() => handleViewModeChange('todos')}
          style={{
            ...styles.viewModeBtn,
            ...(viewMode === 'todos' ? styles.viewModeBtnActive : {})
          }}
        >
          Todos los Pagos
        </button>
        <button
          onClick={() => handleViewModeChange('alumno')}
          style={{
            ...styles.viewModeBtn,
            ...(viewMode === 'alumno' ? styles.viewModeBtnActive : {})
          }}
        >
          Por Alumno
        </button>
      </div>

      {viewMode === 'alumno' && (
        <div style={styles.alumnoSelector}>
          <label style={styles.label}>Selecciona un alumno:</label>
          <select
            value={selectedAlumno}
            onChange={handleAlumnoChange}
            style={styles.select}
          >
            <option value="">-- Selecciona un alumno --</option>
            {alumnos.map(alumno => (
              <option key={alumno.id} value={alumno.id}>
                {alumno.nombre} - DNI: {alumno.dni}
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={styles.header}>
        <h2>
          {viewMode === 'todos' ? 'Todos los pagos' : 
           selectedAlumno ? 'Pagos del alumno' : 'Selecciona un alumno'}
        </h2>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            }
            setShowForm(!showForm);
          }}
          style={styles.addBtn}
          disabled={viewMode === 'alumno' && !selectedAlumno}
        >
          {showForm ? 'Cancelar' : '+ Registrar Pago'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3>{editMode ? '✏️ Editar Pago' : '➕ Registrar Nuevo Pago'}</h3>

          {editMode && (
            <div style={styles.infoBox}>
              <strong>ℹ️ Editando pago de:</strong> {alumnos.find(a => a.id === parseInt(selectedAlumno))?.nombre}
            </div>
          )}

          {!editMode && viewMode === 'todos' && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Alumno: *</label>
              <select
                value={selectedAlumno}
                onChange={handleAlumnoChange}
                style={styles.input}
                required
              >
                <option value="">-- Selecciona un alumno --</option>
                {alumnos.map(alumno => (
                  <option key={alumno.id} value={alumno.id}>
                    {alumno.nombre} - DNI: {alumno.dni}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Fecha de Pago: *</label>
              <input
                type="date"
                value={formData.fecha_pago}
                onChange={(e) => setFormData({...formData, fecha_pago: e.target.value})}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Monto ($): *</label>
              <input
                type="number"
                step="0.01"
                value={formData.monto}
                onChange={(e) => setFormData({...formData, monto: e.target.value})}
                style={styles.input}
                placeholder="0.00"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Método de Pago: *</label>
              <select
                value={formData.metodo_pago}
                onChange={(e) => setFormData({...formData, metodo_pago: e.target.value})}
                style={styles.input}
                required
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
              </select>
            </div>
          </div>

          <h4 style={{marginTop: '20px'}}>Período de Pago</h4>
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Desde:</label>
              <input
                type="date"
                value={formData.periodo_desde}
                onChange={(e) => setFormData({...formData, periodo_desde: e.target.value})}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Hasta:</label>
              <input
                type="date"
                value={formData.periodo_hasta}
                onChange={(e) => setFormData({...formData, periodo_hasta: e.target.value})}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Observaciones:</label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
              style={{...styles.input, minHeight: '80px'}}
              placeholder="Notas adicionales sobre el pago..."
            />
          </div>

          <button type="submit" style={styles.submitBtn}>
            {editMode ? '💾 Actualizar Pago' : '➕ Registrar Pago'}
          </button>
        </form>
      )}

      <div style={styles.tableContainer}>
        <div style={styles.totalSection}>
          <h3>Total: ${calcularTotal()}</h3>
          <p>{pagos.length} pago{pagos.length !== 1 ? 's' : ''} registrado{pagos.length !== 1 ? 's' : ''}</p>
        </div>

        {pagos.length === 0 ? (
          <p>No hay pagos registrados.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Fecha</th>
                {viewMode === 'todos' && <th style={styles.th}>Alumno</th>}
                <th style={styles.th}>Período</th>
                <th style={styles.th}>Monto</th>
                <th style={styles.th}>Método</th>
                <th style={styles.th}>Observaciones</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map(pago => (
                <tr key={pago.id}>
                  <td style={styles.td}>{new Date(pago.fecha_pago).toLocaleDateString()}</td>
                  {viewMode === 'todos' && (
                    <td style={styles.td}>
                      {pago.nombre_alumno || 'N/A'}
                      <br />
                      <small style={{color: '#666'}}>DNI: {pago.dni}</small>
                    </td>
                  )}
                                    <td style={styles.td}>
                    {pago.periodo_desde && pago.periodo_hasta ? (
                      <>
                        {new Date(pago.periodo_desde).toLocaleDateString()} - <br />
                        {new Date(pago.periodo_hasta).toLocaleDateString()}
                      </>
                    ) : '-'}
                  </td>
                  <td style={{...styles.td, fontWeight: 'bold', color: '#27ae60'}}>
                    ${parseFloat(pago.monto).toFixed(2)}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.metodoBadge}>
                      {pago.metodo_pago}
                    </span>
                  </td>
                  <td style={styles.td}>{pago.observaciones || '-'}</td>
                  <td style={styles.td}>
                    <button 
                      onClick={() => handleEdit(pago)} 
                      style={styles.editBtn}
                    >
                      ✏️ Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(pago.id)} 
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
  viewModeSelector: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px'
  },
  viewModeBtn: {
    padding: '10px 20px',
    backgroundColor: '#ecf0f1',
    color: '#2c3e50',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.3s'
  },
  viewModeBtnActive: {
    backgroundColor: '#3498db',
    color: 'white',
    fontWeight: 'bold'
  },
  alumnoSelector: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
  select: {
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
  totalSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
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
  metodoBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    backgroundColor: '#3498db',
    color: 'white',
    borderRadius: '4px',
    fontSize: '12px',
    textTransform: 'capitalize'
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

export default Pagos;

