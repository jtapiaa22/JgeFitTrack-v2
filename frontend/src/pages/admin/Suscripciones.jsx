import { useState, useEffect } from 'react';
import axios from 'axios';
import { suscripcionesService } from '../../services/api';

function Suscripciones() {
  const [suscripciones, setSuscripciones] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    id_cliente: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: '',
    estado: 'activa',
    monto: '',
    metodo_pago: 'transferencia',
    comprobante: '',
    notas: ''
  });

  useEffect(() => {
    loadSuscripciones();
    loadProfesores();
  }, []);

  const loadSuscripciones = async () => {
    try {
      const response = await suscripcionesService.getAll();
      setSuscripciones(response.data);
    } catch (error) {
      console.error('Error cargando suscripciones:', error);
      setSuscripciones([]);
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        estado: formData.estado,
        monto: parseFloat(formData.monto),
        metodo_pago: formData.metodo_pago,
        comprobante: formData.comprobante,
        notas: formData.notas
      };

      if (editMode && editId) {
        // EDITAR
        await suscripcionesService.update(editId, payload);
        alert('✅ Suscripción actualizada correctamente');
      } else {
        // CREAR
        await suscripcionesService.create({
          ...payload,
          id_cliente: parseInt(formData.id_cliente)
        });
        
        const profesor = profesores.find(p => p.id === parseInt(formData.id_cliente));
        alert(`✅ Suscripción registrada correctamente para ${profesor?.nombre}. El profesor ha sido activado automáticamente.`);
      }

      setShowForm(false);
      resetForm();
      loadSuscripciones();
    } catch (error) {
      console.error('Error guardando suscripción:', error);
      alert('❌ Error al guardar suscripción');
    }
  };

  const resetForm = () => {
    setEditMode(false);
    setEditId(null);
    setFormData({
      id_cliente: '',
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: '',
      estado: 'activa',
      monto: '',
      metodo_pago: 'transferencia',
      comprobante: '',
      notas: ''
    });
  };

  const handleEdit = (sub) => {
    setEditMode(true);
    setEditId(sub.id);
    setFormData({
      id_cliente: sub.id_cliente,
      fecha_inicio: sub.fecha_inicio.split('T')[0],
      fecha_fin: sub.fecha_fin.split('T')[0],
      estado: sub.estado_calculado || sub.estado,
      monto: sub.monto,
      metodo_pago: sub.metodo_pago,
      comprobante: sub.comprobante || '',
      notas: sub.notas || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const sub = suscripciones.find(s => s.id === id);
    const esActiva = (sub.estado_calculado || sub.estado) === 'activa';
    
    const mensaje = esActiva 
      ? '¿Estás seguro de eliminar esta suscripción ACTIVA? El profesor será desactivado si no tiene otras suscripciones.'
      : '¿Estás seguro de eliminar esta suscripción?';
    
    if (window.confirm(mensaje)) {
      try {
        const response = await suscripcionesService.delete(id);
        if (response.data.profesorDesactivado) {
          alert('⚠️ Suscripción eliminada. El profesor ha sido desactivado automáticamente.');
        } else {
          alert('✅ Suscripción eliminada correctamente.');
        }
        loadSuscripciones();
      } catch (error) {
        console.error('Error eliminando suscripción:', error);
        alert('❌ Error al eliminar suscripción');
      }
    }
  };

  const calcularTotal = () => {
    return suscripciones
      .reduce((sum, sub) => sum + parseFloat(sub.monto || 0), 0)
      .toFixed(2);
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'activa': return '#27ae60';
      case 'vencida': return '#e74c3c';
      case 'cancelada': return '#95a5a6';
      default: return '#3498db';
    }
  };

  const calcularEstadisticas = () => {
    const activas = suscripciones.filter(s => (s.estado_calculado || s.estado) === 'activa').length;
    const vencidas = suscripciones.filter(s => (s.estado_calculado || s.estado) === 'vencida').length;
    return { activas, vencidas };
  };

  const calcularFechaFin = (fechaInicio, meses = 1) => {
    const fecha = new Date(fechaInicio);
    fecha.setMonth(fecha.getMonth() + meses);
    return fecha.toISOString().split('T')[0];
  };

  const { activas, vencidas } = calcularEstadisticas();

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1>Gestión de Suscripciones</h1>
          <p style={{ color: '#7f8c8d', margin: '5px 0' }}>
            Control de pagos de profesores hacia el sistema
          </p>
        </div>
        <button 
          onClick={() => { 
            if (showForm) {
              resetForm();
            }
            setShowForm(!showForm); 
          }} 
          style={styles.addBtn}
        >
          {showForm ? 'Cancelar' : '+ Registrar Pago'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3>{editMode ? '✏️ Editar Suscripción' : '➕ Registrar Pago de Suscripción'}</h3>

          {!editMode && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Profesor: *</label>
              <select
                value={formData.id_cliente}
                onChange={(e) => setFormData({...formData, id_cliente: e.target.value})}
                style={styles.input}
                required
              >
                <option value="">-- Selecciona un profesor --</option>
                {profesores.map(prof => (
                  <option key={prof.id} value={prof.id}>
                    {prof.nombre} - {prof.usuario}
                  </option>
                ))}
              </select>
            </div>
          )}

          {editMode && (
            <div style={styles.infoBox}>
              <strong>ℹ️ Editando suscripción de:</strong> {profesores.find(p => p.id === formData.id_cliente)?.nombre}
            </div>
          )}

          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Fecha Inicio: *</label>
              <input
                type="date"
                value={formData.fecha_inicio}
                onChange={(e) => {
                  const fechaInicio = e.target.value;
                  setFormData({
                    ...formData, 
                    fecha_inicio: fechaInicio,
                    fecha_fin: calcularFechaFin(fechaInicio, 1)
                  });
                }}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Fecha Fin: *</label>
              <input
                type="date"
                value={formData.fecha_fin}
                onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})}
                style={styles.input}
                required
              />
              <small style={{color: '#7f8c8d'}}>Auto-calculado (1 mes)</small>
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
          </div>

          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Método de Pago: *</label>
              <select
                value={formData.metodo_pago}
                onChange={(e) => setFormData({...formData, metodo_pago: e.target.value})}
                style={styles.input}
                required
              >
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Estado: *</label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({...formData, estado: e.target.value})}
                style={styles.input}
                required
              >
                <option value="activa">Activa</option>
                <option value="vencida">Vencida</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Comprobante:</label>
              <input
                type="text"
                value={formData.comprobante}
                onChange={(e) => setFormData({...formData, comprobante: e.target.value})}
                style={styles.input}
                placeholder="Nro de comprobante/referencia"
              />
            </div>
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
            {editMode ? '💾 Actualizar Suscripción' : '➕ Registrar Suscripción'}
          </button>
        </form>
      )}

      <div style={styles.statsBar}>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Total Ingresos:</span>
          <span style={styles.statValue}>${calcularTotal()}</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Total Suscripciones:</span>
          <span style={styles.statValue}>{suscripciones.length}</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Activas:</span>
          <span style={{ ...styles.statValue, color: '#27ae60' }}>{activas}</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Vencidas:</span>
          <span style={{ ...styles.statValue, color: '#e74c3c' }}>{vencidas}</span>
        </div>
      </div>

      <div style={styles.tableContainer}>
        {suscripciones.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
            No hay suscripciones registradas
          </p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Profesor</th>
                <th style={styles.th}>Período</th>
                <th style={styles.th}>Monto</th>
                <th style={styles.th}>Método</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Comprobante</th>
                <th style={styles.th}>Notas</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {suscripciones.map(sub => {
                const estadoFinal = sub.estado_calculado || sub.estado;
                return (
                  <tr key={sub.id}>
                    <td style={styles.td}>
                      <strong>{sub.nombre_profesor}</strong><br />
                      <small style={{ color: '#7f8c8d' }}>{sub.usuario}</small>
                    </td>
                    <td style={styles.td}>
                      {new Date(sub.fecha_inicio).toLocaleDateString()}<br />
                      <small style={{ color: '#7f8c8d' }}>
                        hasta {new Date(sub.fecha_fin).toLocaleDateString()}
                      </small>
                    </td>
                                        <td style={{ ...styles.td, fontWeight: 'bold', color: '#27ae60', fontSize: '16px' }}>
                      ${parseFloat(sub.monto).toFixed(2)}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.metodoBadge}>{sub.metodo_pago}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ 
                        ...styles.estadoBadge, 
                        backgroundColor: getEstadoColor(estadoFinal) 
                      }}>
                        {estadoFinal}
                      </span>
                    </td>
                    <td style={styles.td}>{sub.comprobante || '-'}</td>
                    <td style={styles.td}>{sub.notas || '-'}</td>
                    <td style={styles.td}>
                      <button 
                        onClick={() => handleEdit(sub)} 
                        style={styles.editBtn}
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        onClick={() => handleDelete(sub.id)} 
                        style={styles.deleteBtn}
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
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
    padding: '12px 24px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  form: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
    fontWeight: 'bold',
    marginTop: '10px'
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
  statsBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '20px'
  },
  statItem: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  statLabel: {
    fontSize: '13px',
    color: '#7f8c8d',
    marginBottom: '8px'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  tableContainer: {
    backgroundColor: '#044d49ff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflowX: 'auto'
  },
  table: {
    color: '#e2c984ff',
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '2px solid #000000ff',
    backgroundColor: '#003a24ff',
    fontSize: '13px',
    fontWeight: 'bold'
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #0f0101ff',
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
  estadoBadge: {
    display: 'inline-block',
    padding: '6px 12px',
    color: 'white',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase'
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

export default Suscripciones;

