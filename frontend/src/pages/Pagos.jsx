import { useState, useEffect } from 'react';
import { alumnosService, pagosService } from '../services/api';

function Pagos() {
  const [alumnos, setAlumnos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [pagosFiltrados, setPagosFiltrados] = useState([]);
  const [selectedAlumno, setSelectedAlumno] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('todos');
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  // Estados para filtros
  const [filtroMetodo, setFiltroMetodo] = useState('todos');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [filtroMontoMin, setFiltroMontoMin] = useState('');
  const [filtroMontoMax, setFiltroMontoMax] = useState('');
  const [ordenamiento, setOrdenamiento] = useState('fecha-desc');

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

  // Aplicar filtros cada vez que cambien
  useEffect(() => {
    aplicarFiltros();
  }, [pagos, filtroMetodo, filtroFechaDesde, filtroFechaHasta, filtroMontoMin, filtroMontoMax, ordenamiento]);

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

  const aplicarFiltros = () => {
    let resultado = [...pagos];

    // 1. FILTRO por método de pago
    if (filtroMetodo !== 'todos') {
      resultado = resultado.filter(pago => pago.metodo_pago === filtroMetodo);
    }

    // 2. FILTRO por rango de fechas
    if (filtroFechaDesde) {
      resultado = resultado.filter(pago => 
        new Date(pago.fecha_pago) >= new Date(filtroFechaDesde)
      );
    }
    if (filtroFechaHasta) {
      resultado = resultado.filter(pago => 
        new Date(pago.fecha_pago) <= new Date(filtroFechaHasta)
      );
    }

    // 3. FILTRO por rango de montos
    if (filtroMontoMin !== '') {
      resultado = resultado.filter(pago => 
        parseFloat(pago.monto) >= parseFloat(filtroMontoMin)
      );
    }
    if (filtroMontoMax !== '') {
      resultado = resultado.filter(pago => 
        parseFloat(pago.monto) <= parseFloat(filtroMontoMax)
      );
    }

    // 4. ORDENAMIENTO
    resultado.sort((a, b) => {
      switch(ordenamiento) {
        case 'fecha-desc':
          return new Date(b.fecha_pago) - new Date(a.fecha_pago);
        case 'fecha-asc':
          return new Date(a.fecha_pago) - new Date(b.fecha_pago);
        case 'monto-desc':
          return parseFloat(b.monto) - parseFloat(a.monto);
        case 'monto-asc':
          return parseFloat(a.monto) - parseFloat(b.monto);
        case 'alumno-asc':
          return (a.nombre_alumno || '').localeCompare(b.nombre_alumno || '');
        case 'alumno-desc':
          return (b.nombre_alumno || '').localeCompare(a.nombre_alumno || '');
        default:
          return 0;
      }
    });

    setPagosFiltrados(resultado);
  };

  const limpiarFiltros = () => {
    setFiltroMetodo('todos');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
    setFiltroMontoMin('');
    setFiltroMontoMax('');
    setOrdenamiento('fecha-desc');
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
        await pagosService.update(editId, payload);
        alert('✅ Pago actualizado correctamente');
      } else {
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
    return pagosFiltrados.reduce((sum, pago) => sum + parseFloat(pago.monto || 0), 0).toFixed(2);
  };

  if (loading) return <div>Cargando...</div>;

  const hayFiltrosActivos = filtroMetodo !== 'todos' || filtroFechaDesde !== '' || 
                            filtroFechaHasta !== '' || filtroMontoMin !== '' || 
                            filtroMontoMax !== '' || ordenamiento !== 'fecha-desc';

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

      {/* PANEL DE FILTROS */}
      <div style={styles.filtersContainer}>
        <h3 style={{marginTop: 0, marginBottom: '15px'}}>🔍 Filtros y Búsqueda</h3>
        
        <div style={styles.filtersGrid}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Método de pago:</label>
            <select
              value={filtroMetodo}
              onChange={(e) => setFiltroMetodo(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="todos">Todos</option>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="debito">Débito</option>
              <option value="credito">Crédito</option>
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Fecha desde:</label>
            <input
              type="date"
              value={filtroFechaDesde}
              onChange={(e) => setFiltroFechaDesde(e.target.value)}
              style={styles.filterInput}
            />
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Fecha hasta:</label>
            <input
              type="date"
              value={filtroFechaHasta}
              onChange={(e) => setFiltroFechaHasta(e.target.value)}
              style={styles.filterInput}
            />
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Monto mínimo ($):</label>
            <input
              type="number"
              step="0.01"
              value={filtroMontoMin}
              onChange={(e) => setFiltroMontoMin(e.target.value)}
              style={styles.filterInput}
              placeholder="0.00"
            />
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Monto máximo ($):</label>
            <input
              type="number"
              step="0.01"
              value={filtroMontoMax}
              onChange={(e) => setFiltroMontoMax(e.target.value)}
              style={styles.filterInput}
              placeholder="Sin límite"
            />
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Ordenar por:</label>
            <select
              value={ordenamiento}
              onChange={(e) => setOrdenamiento(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="fecha-desc">Fecha (más reciente)</option>
              <option value="fecha-asc">Fecha (más antigua)</option>
              <option value="monto-desc">Monto (mayor a menor)</option>
              <option value="monto-asc">Monto (menor a mayor)</option>
              {viewMode === 'todos' && <option value="alumno-asc">Alumno (A-Z)</option>}
              {viewMode === 'todos' && <option value="alumno-desc">Alumno (Z-A)</option>}
            </select>
          </div>
        </div>

        {hayFiltrosActivos && (
          <button onClick={limpiarFiltros} style={styles.clearFiltersBtn}>
            🔄 Limpiar todos los filtros
          </button>
        )}

        <div style={styles.resultsInfo}>
          <span>
            Mostrando <strong>{pagosFiltrados.length}</strong> de <strong>{pagos.length}</strong> pagos
            {pagosFiltrados.length > 0 && (
              <> | Total filtrado: <strong>${calcularTotal()}</strong></>
            )}
          </span>
        </div>
      </div>

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
          <p>{pagosFiltrados.length} pago{pagosFiltrados.length !== 1 ? 's' : ''} {hayFiltrosActivos ? 'filtrado' + (pagosFiltrados.length !== 1 ? 's' : '') : 'registrado' + (pagosFiltrados.length !== 1 ? 's' : '')}</p>
        </div>

        {pagosFiltrados.length === 0 ? (
          <p style={styles.noResults}>
            {hayFiltrosActivos 
              ? '🔍 No se encontraron pagos con los filtros aplicados' 
              : 'No hay pagos registrados'}
          </p>
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
              {pagosFiltrados.map(pago => (
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
  filtersContainer: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  filtersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '15px'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column'
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
  filterInput: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #bdc3c7',
        borderRadius: '4px',
    outline: 'none'
  },
  clearFiltersBtn: {
    padding: '10px 20px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    marginTop: '10px',
    width: '100%'
  },
  resultsInfo: {
    fontSize: '14px',
    color: '#7f8c8d',
    padding: '12px',
    backgroundColor: '#ecf0f1',
    borderRadius: '4px',
    textAlign: 'center',
    marginTop: '15px'
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


