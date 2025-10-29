import { useState, useEffect } from 'react';
import { alumnosService, medicionesService } from '../services/api';
import toast from 'react-hot-toast'; // ⬅️ AGREGAR
import LoadingSpinner from '../components/LoadingSpinner'; // ⬅️ AGREGAR

function Mediciones() {
  const [alumnos, setAlumnos] = useState([]);
  const [mediciones, setMediciones] = useState([]);
  const [medicionesFiltradas, setMedicionesFiltradas] = useState([]);
  const [selectedAlumno, setSelectedAlumno] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // ⬅️ AGREGAR
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  // Estados para filtros
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [filtroPesoMin, setFiltroPesoMin] = useState('');
  const [filtroPesoMax, setFiltroPesoMax] = useState('');
  const [filtroAlumno, setFiltroAlumno] = useState('todos');
  const [ordenamiento, setOrdenamiento] = useState('fecha-desc');

  const [formData, setFormData] = useState({
    fecha_medicion: new Date().toISOString().split('T')[0],
    peso: '',
    altura: '',
    cuello: '',
    cintura: '',
    cadera: '',
    usa_balanza: false,
    grasa_corporal_balanza: '',
    agua_corporal_balanza: '',
    masa_muscular_balanza: '',
    notas: '',
    edad: '',
    sexo: ''
  });

  useEffect(() => {
    loadAlumnos();
  }, []);

  useEffect(() => {
    if (alumnos.length > 0){
      loadAllMediciones();
    }
  },[alumnos]);

  const calcularEdad = (fechaNacimiento) => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  };

  useEffect(() => {
    if (selectedAlumno && !editMode) {
      const alumno = alumnos.find(a => a.id === parseInt(selectedAlumno));
      if (alumno) {
        setFormData(prev => ({
          ...prev,
          edad: calcularEdad(alumno.fecha_nacimiento), // ⬅️ CORREGIR
          sexo: alumno.sexo
        }));
      }
    }
  }, [selectedAlumno, alumnos, editMode]);

  // Aplicar filtros
  useEffect(() => {
    aplicarFiltros();
  }, [mediciones, filtroFechaDesde, filtroFechaHasta, filtroPesoMin, filtroPesoMax, filtroAlumno, ordenamiento]);

  const loadAlumnos = async () => {
    try {
      setLoading(true); // ⬅️ AGREGAR
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await alumnosService.getByProfesor(user.id);
      setAlumnos(response.data);
    } catch (error) {
      console.error('Error cargando alumnos:', error);
      toast.error('Error al cargar los alumnos'); // ⬅️ TOAST
    } finally {
      setLoading(false);
    }
  };

  const loadAllMediciones = async () => {
    try {
      if (alumnos.length === 0) return;
      
      const allMediciones = [];
      
      for (const alumno of alumnos) {
        try {
          const response = await medicionesService.getByAlumno(alumno.id);
          const medicionesConAlumno = response.data.map(m => ({
            ...m,
            nombre_alumno: alumno.nombre,
            dni_alumno: alumno.dni
          }));
          allMediciones.push(...medicionesConAlumno);
        } catch (err) {
          console.log(`No hay mediciones para ${alumno.nombre}`);
        }
      }
      
      setMediciones(allMediciones);
      if (allMediciones.length > 0) { // ⬅️ AGREGAR
        toast.success(`${allMediciones.length} medición(es) cargada(s)`);
      }
    } catch (error) {
      console.error('Error cargando mediciones:', error);
      toast.error('Error al cargar las mediciones'); // ⬅️ TOAST
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...mediciones];

    // 1. FILTRO por alumno
    if (filtroAlumno !== 'todos') {
      resultado = resultado.filter(m => m.id_alumno === parseInt(filtroAlumno));
    }

    // 2. FILTRO por rango de fechas
    if (filtroFechaDesde) {
      resultado = resultado.filter(m => 
        new Date(m.fecha_medicion) >= new Date(filtroFechaDesde)
      );
    }
    if (filtroFechaHasta) {
      resultado = resultado.filter(m => 
        new Date(m.fecha_medicion) <= new Date(filtroFechaHasta)
      );
    }

    // 3. FILTRO por rango de peso
    if (filtroPesoMin !== '') {
      resultado = resultado.filter(m => 
        parseFloat(m.peso) >= parseFloat(filtroPesoMin)
      );
    }
    if (filtroPesoMax !== '') {
      resultado = resultado.filter(m => 
        parseFloat(m.peso) <= parseFloat(filtroPesoMax)
      );
    }

    // 4. ORDENAMIENTO
    resultado.sort((a, b) => {
      switch(ordenamiento) {
        case 'fecha-desc':
          return new Date(b.fecha_medicion) - new Date(a.fecha_medicion);
        case 'fecha-asc':
          return new Date(a.fecha_medicion) - new Date(b.fecha_medicion);
        case 'peso-desc':
          return parseFloat(b.peso) - parseFloat(a.peso);
        case 'peso-asc':
          return parseFloat(a.peso) - parseFloat(b.peso);
        case 'imc-desc':
          return parseFloat(b.imc) - parseFloat(a.imc);
        case 'imc-asc':
          return parseFloat(a.imc) - parseFloat(b.imc);
        case 'alumno-asc':
          return (a.nombre_alumno || '').localeCompare(b.nombre_alumno || '');
        case 'alumno-desc':
          return (b.nombre_alumno || '').localeCompare(a.nombre_alumno || '');
        default:
          return 0;
      }
    });

    setMedicionesFiltradas(resultado);
  };

  const limpiarFiltros = () => {
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
    setFiltroPesoMin('');
    setFiltroPesoMax('');
    setFiltroAlumno('todos');
    setOrdenamiento('fecha-desc');
    toast.success('Filtros limpiados'); // ⬅️ TOAST
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAlumno) {
      toast.error('Debes seleccionar un alumno'); // ⬅️ TOAST
      return;
    }

    setSaving(true); // ⬅️ LOADING STATE

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const payload = {
        id_alumno: parseInt(selectedAlumno),
        id_profesor: user.id,
        fecha_medicion: formData.fecha_medicion,
        peso: parseFloat(formData.peso),
        altura: parseFloat(formData.altura),
        cuello: formData.cuello ? parseFloat(formData.cuello) : null,
        cintura: formData.cintura ? parseFloat(formData.cintura) : null,
        cadera: formData.cadera ? parseFloat(formData.cadera) : null,
        usa_balanza: formData.usa_balanza,
        grasa_corporal_balanza: formData.usa_balanza && formData.grasa_corporal_balanza ? parseFloat(formData.grasa_corporal_balanza) : null,
        agua_corporal_balanza: formData.usa_balanza && formData.agua_corporal_balanza ? parseFloat(formData.agua_corporal_balanza) : null,
        masa_muscular_balanza: formData.usa_balanza && formData.masa_muscular_balanza ? parseFloat(formData.masa_muscular_balanza) : null,
        notas: formData.notas,
        edad: parseInt(formData.edad),
        sexo: formData.sexo
      };

      if (editMode && editId) {
        await medicionesService.update(editId, payload);
        toast.success('✅ Medición actualizada correctamente'); // ⬅️ TOAST
      } else {
        await medicionesService.create(payload);
        toast.success('✅ Medición registrada correctamente'); // ⬅️ TOAST
      }

      setShowForm(false);
      resetForm();
      loadAllMediciones();
    } catch (error) {
      console.error('Error guardando medición:', error);
      toast.error('❌ Error al guardar medición'); // ⬅️ TOAST
    } finally {
      setSaving(false); // ⬅️ LOADING STATE
    }
  };

  const resetForm = () => {
    setEditMode(false);
    setEditId(null);
    setSelectedAlumno('');
    setFormData({
      fecha_medicion: new Date().toISOString().split('T')[0],
      peso: '',
      altura: '',
      cuello: '',
      cintura: '',
      cadera: '',
      usa_balanza: false,
      grasa_corporal_balanza: '',
      agua_corporal_balanza: '',
      masa_muscular_balanza: '',
      notas: '',
      edad: '',
      sexo: ''
    });
  };

  const handleEdit = (medicion) => {
    setEditMode(true);
    setEditId(medicion.id);
    setSelectedAlumno(medicion.id_alumno);
    setFormData({
      fecha_medicion: medicion.fecha_medicion.split('T')[0],
      peso: medicion.peso,
      altura: medicion.altura,
      cuello: medicion.cuello || '',
      cintura: medicion.cintura || '',
      cadera: medicion.cadera || '',
      usa_balanza: medicion.usa_balanza,
      grasa_corporal_balanza: medicion.grasa_corporal_balanza || '',
      agua_corporal_balanza: medicion.agua_corporal_balanza || '',
      masa_muscular_balanza: medicion.masa_muscular_balanza || '',
      notas: medicion.notas || '',
      edad: medicion.edad,
      sexo: medicion.sexo
    });
    setShowForm(true);
    toast.info(`Editando medición de ${medicion.nombre_alumno}`); // ⬅️ TOAST
  };

  const handleDelete = async (id, nombre) => {
    // ⬅️ USAR toast.promise
    toast.promise(
      medicionesService.delete(id),
      {
        loading: `Eliminando medición de ${nombre}...`,
        success: () => {
          loadAllMediciones();
          return `✅ Medición eliminada correctamente`;
        },
        error: '❌ Error al eliminar medición'
      }
    );
  };

  const getIMCCategoria = (imc) => {
    if (imc < 18.5) return { texto: 'Bajo peso', color: '#3498db' };
    if (imc < 25) return { texto: 'Normal', color: '#27ae60' };
    if (imc < 30) return { texto: 'Sobrepeso', color: '#f39c12' };
    return { texto: 'Obesidad', color: '#e74c3c' };
  };

  if (loading) return <LoadingSpinner />; // ⬅️ COMPONENTE LOADING

  const hayFiltrosActivos = filtroFechaDesde !== '' || filtroFechaHasta !== '' || 
                            filtroPesoMin !== '' || filtroPesoMax !== '' || 
                            filtroAlumno !== 'todos' || ordenamiento !== 'fecha-desc';

  return (
    <div style={{animation: 'fadeIn 0.3s ease-in'}}> {/* ⬅️ ANIMACIÓN */}
      <h1 style={{marginBottom: '20px', color: '#2c3e50'}}>Gestión de Mediciones</h1>

      {/* PANEL DE FILTROS */}
      <div style={styles.filtersContainer}>
        <h3 style={{marginTop: 0, marginBottom: '15px'}}>🔍 Filtros y Búsqueda</h3>
        
        <div style={styles.filtersGrid}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Filtrar por alumno:</label>
            <select
              value={filtroAlumno}
              onChange={(e) => setFiltroAlumno(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="todos">Todos los alumnos</option>
              {alumnos.map(alumno => (
                <option key={alumno.id} value={alumno.id}>
                  {alumno.nombre}
                </option>
              ))}
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
            <label style={styles.filterLabel}>Peso mínimo (kg):</label>
            <input
              type="number"
              step="0.1"
              value={filtroPesoMin}
              onChange={(e) => setFiltroPesoMin(e.target.value)}
              style={styles.filterInput}
              placeholder="0.0"
            />
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Peso máximo (kg):</label>
            <input
              type="number"
              step="0.1"
              value={filtroPesoMax}
              onChange={(e) => setFiltroPesoMax(e.target.value)}
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
              <option value="peso-desc">Peso (mayor a menor)</option>
              <option value="peso-asc">Peso (menor a mayor)</option>
              <option value="imc-desc">IMC (mayor a menor)</option>
              <option value="imc-asc">IMC (menor a mayor)</option>
              <option value="alumno-asc">Alumno (A-Z)</option>
              <option value="alumno-desc">Alumno (Z-A)</option>
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
            Mostrando <strong>{medicionesFiltradas.length}</strong> de <strong>{mediciones.length}</strong> mediciones
          </span>
        </div>
      </div>

      <div style={styles.header}>
        <h2>Mediciones registradas</h2>
        <button
          onClick={() => {
            if (showForm) {
              // Si el formulario está abierto, cerrarlo y resetear
              setShowForm(false);
              resetForm();
              toast.info('Formulario cancelado');
            } else {
              // Si está cerrado, abrirlo
              setShowForm(true);
            }
          }}
          style={{
            ...styles.addBtn,
            backgroundColor: showForm ? '#e74c3c' : '#3498db'
          }}
        >
          {showForm ? '✕ Cancelar' : '+ Registrar Medición'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{...styles.form, animation: 'slideIn 0.3s ease-out'}}> {/* ⬅️ ANIMACIÓN */}
          <h3>{editMode ? '✏️ Editar Medición' : '➕ Registrar Nueva Medición'}</h3>

          {editMode && (
            <div style={styles.infoBox}>
              <strong>ℹ️ Editando medición de:</strong> {alumnos.find(a => a.id === parseInt(selectedAlumno))?.nombre}
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Alumno: *</label>
            <select
              value={selectedAlumno}
              onChange={(e) => setSelectedAlumno(e.target.value)}
              style={styles.input}
              required
              disabled={editMode}
            >
              <option value="">-- Selecciona un alumno --</option>
              {alumnos.map(alumno => (
                <option key={alumno.id} value={alumno.id}>
                  {alumno.nombre} - DNI: {alumno.dni}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Fecha de Medición: *</label>
              <input
                type="date"
                value={formData.fecha_medicion}
                onChange={(e) => setFormData({...formData, fecha_medicion: e.target.value})}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Peso (kg): *</label>
              <input
                type="number"
                step="0.1"
                value={formData.peso}
                onChange={(e) => setFormData({...formData, peso: e.target.value})}
                style={styles.input}
                placeholder="70.5"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Altura (cm): *</label>
              <input
                type="number"
                step="0.1"
                value={formData.altura}
                onChange={(e) => setFormData({...formData, altura: e.target.value})}
                style={styles.input}
                placeholder="175"
                required
              />
            </div>
          </div>

          <h4 style={{marginTop: '20px', marginBottom: '10px'}}>Medidas Corporales (para estimación)</h4>
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Cuello (cm):</label>
              <input
                type="number"
                step="0.1"
                value={formData.cuello}
                onChange={(e) => setFormData({...formData, cuello: e.target.value})}
                style={styles.input}
                placeholder="Opcional"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Cintura (cm):</label>
              <input
                type="number"
                step="0.1"
                value={formData.cintura}
                onChange={(e) => setFormData({...formData, cintura: e.target.value})}
                style={styles.input}
                placeholder="Opcional"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Cadera (cm):</label>
              <input
                type="number"
                step="0.1"
                value={formData.cadera}
                onChange={(e) => setFormData({...formData, cadera: e.target.value})}
                style={styles.input}
                placeholder="Opcional (solo mujeres)"
              />
            </div>
          </div>

          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.usa_balanza}
                onChange={(e) => setFormData({...formData, usa_balanza: e.target.checked})}
                style={styles.checkbox}
              />
              <strong>Usar datos de balanza inteligente</strong>
            </label>
          </div>

          {formData.usa_balanza && (
            <>
              <h4 style={{marginTop: '20px', marginBottom: '10px'}}>Datos de Balanza Inteligente</h4>
              <div style={styles.row}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Grasa Corporal (%):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.grasa_corporal_balanza}
                    onChange={(e) => setFormData({...formData, grasa_corporal_balanza: e.target.value})}
                    style={styles.input}
                    placeholder="25.5"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Agua Corporal (%):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.agua_corporal_balanza}
                    onChange={(e) => setFormData({...formData, agua_corporal_balanza: e.target.value})}
                    style={styles.input}
                    placeholder="60.0"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Masa Muscular (%):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.masa_muscular_balanza}
                    onChange={(e) => setFormData({...formData, masa_muscular_balanza: e.target.value})}
                    style={styles.input}
                    placeholder="45.0"
                  />
                </div>
              </div>
            </>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Notas:</label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({...formData, notas: e.target.value})}
              style={{...styles.input, minHeight: '80px'}}
              placeholder="Observaciones sobre la medición..."
            />
          </div>

          <button 
            type="submit" 
            style={styles.submitBtn}
            disabled={saving} // ⬅️ DESHABILITAR MIENTRAS GUARDA
          >
            {saving ? ( // ⬅️ SPINNER MIENTRAS GUARDA
              <span style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
                <span style={styles.buttonSpinner}></span>
                Guardando...
              </span>
            ) : (
              editMode ? '💾 Actualizar Medición' : '➕ Registrar Medición'
            )}
          </button>
        </form>
      )}

      <div style={styles.tableContainer}>
        {medicionesFiltradas.length === 0 ? (
          <div style={styles.noResults}> {/* ⬅️ MEJORADO */}
            <div style={{fontSize: '48px', marginBottom: '10px'}}>📊</div>
            <p>
              {hayFiltrosActivos 
                ? '🔍 No se encontraron mediciones con los filtros aplicados' 
                : 'No hay mediciones registradas'}
            </p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Alumno</th>
                <th style={styles.th}>Peso</th>
                <th style={styles.th}>Altura</th>
                <th style={styles.th}>IMC</th>
                <th style={styles.th}>Grasa %</th>
                <th style={styles.th}>Método</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {medicionesFiltradas.map(medicion => {
                const imcData = getIMCCategoria(medicion.imc);
                return (
                  <tr key={medicion.id} style={{transition: 'background-color 0.2s ease'}}> {/* ⬅️ TRANSICIÓN */}
                    <td style={styles.td}>{new Date(medicion.fecha_medicion).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <strong>{medicion.nombre_alumno}</strong>
                      <br />
                      <small style={{color: '#666'}}>DNI: {medicion.dni_alumno}</small>
                    </td>
                    <td style={styles.td}><strong>{medicion.peso} kg</strong></td>
                    <td style={styles.td}>{medicion.altura} cm</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.imcBadge,
                        backgroundColor: imcData.color
                      }}>
                        {medicion.imc} - {imcData.texto}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {medicion.usa_balanza && medicion.grasa_corporal_balanza 
                        ? `${medicion.grasa_corporal_balanza}%` 
                        : medicion.grasa_corporal_estimada 
                          ? `~${medicion.grasa_corporal_estimada}%`
                          : '-'}
                    </td>
                    <td style={styles.td}>
                      {medicion.usa_balanza ? (
                        <span style={{...styles.metodoBadge, backgroundColor: '#9b59b6'}}>
                          📊 Balanza
                        </span>
                      ) : (
                        <span style={{...styles.metodoBadge, backgroundColor: '#3498db'}}>
                          📏 Estimación
                        </span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <button onClick={() => handleEdit(medicion)} style={styles.editBtn}>
                        ✏️ Editar
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm(`¿Estás seguro de eliminar esta medición de ${medicion.nombre_alumno}?`)) {
                            handleDelete(medicion.id, medicion.nombre_alumno);
                          }
                        }} 
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

// ⬅️ AGREGAR KEYFRAMES
const styleSheet = document.styleSheets[0];
if (styleSheet) {
  try {
    styleSheet.insertRule(`
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `, styleSheet.cssRules.length);

    styleSheet.insertRule(`
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `, styleSheet.cssRules.length);

    styleSheet.insertRule(`
      @keyframes buttonSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `, styleSheet.cssRules.length);
  } catch (e) {
    console.log('Error adding keyframes');
  }
}

const styles = {
  filtersContainer: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'box-shadow 0.3s ease'
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
    outline: 'none',
    transition: 'border-color 0.3s ease'
  },
  filterInput: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    outline: 'none',
    transition: 'border-color 0.3s ease'
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
    width: '100%',
    transition: 'all 0.3s ease'
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
    padding: '60px 20px',
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
    padding: '12px 24px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  },
  form: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
    fontSize: '14px',
    color: '#2c3e50'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s ease'
  },
  checkboxGroup: {
    marginTop: '20px',
    marginBottom: '10px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '14px'
  },
  checkbox: {
    marginRight: '10px',
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  submitBtn: {
    padding: '12px 30px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
    fontSize: '16px',
    fontWeight: 'bold',
    marginTop: '20px',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 4px rgba(39,174,96,0.3)'
  },
  buttonSpinner: {
    display: 'inline-block',
    width: '16px',
    height: '16px',
    border: '3px solid rgba(255,255,255,0.3)',
    borderTop: '3px solid white',
    borderRadius: '50%',
    animation: 'buttonSpin 0.8s linear infinite'
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#2c3e50',
    whiteSpace: 'nowrap'
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #ddd',
    fontSize: '14px'
  },
  imcBadge: {
    display: 'inline-block',
    padding: '6px 12px',
    color: 'white',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap'
  },
  metodoBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    color: 'white',
    borderRadius: '4px',
    fontSize: '12px',
    whiteSpace: 'nowrap'
  },
  editBtn: {
    padding: '6px 12px',
    backgroundColor: '#f39c12',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    marginRight: '8px',
    transition: 'all 0.3s ease'
  },
  deleteBtn: {
    padding: '6px 12px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.3s ease'
  }
};

export default Mediciones;

