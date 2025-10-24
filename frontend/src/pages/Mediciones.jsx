import { useState, useEffect } from 'react';
import { alumnosService, medicionesService } from '../services/api';

function Mediciones() {
  const [alumnos, setAlumnos] = useState([]);
  const [selectedAlumno, setSelectedAlumno] = useState('');
  const [mediciones, setMediciones] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [usarBalanza, setUsarBalanza] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    peso: '',
    altura: '',
    cintura: '',
    cadera: '',
    brazo: '',
    pierna: '',
    // Datos de balanza
    grasa_corporal: '',
    agua_corporal: '',
    masa_muscular: '',
    // Calculados
    imc: '',
    notas: ''
  });

  useEffect(() => {
    loadAlumnos();
  }, []);

  useEffect(() => {
    if (selectedAlumno) {
      loadMediciones(selectedAlumno);
    }
  }, [selectedAlumno]);

  // Calcular IMC automáticamente cuando cambian peso y altura
  useEffect(() => {
    if (formData.peso && formData.altura) {
      const alturaMetros = formData.altura / 100;
      const imc = (formData.peso / (alturaMetros * alturaMetros)).toFixed(2);
      setFormData(prev => ({ ...prev, imc }));
    }
  }, [formData.peso, formData.altura]);

  // Si usa balanza manual, calcular estimaciones
  useEffect(() => {
    if (!usarBalanza && formData.peso && formData.altura && formData.edad && formData.sexo) {
      calcularEstimaciones();
    }
  }, [usarBalanza, formData.peso, formData.altura, formData.edad, formData.sexo]);

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

  const loadMediciones = async (id_alumno) => {
    try {
      const response = await medicionesService.getByAlumno(id_alumno);
      setMediciones(response.data);
    } catch (error) {
      console.error('Error cargando mediciones:', error);
      setMediciones([]);
    }
  };

  const calcularEstimaciones = () => {
    // Fórmulas estimadas basadas en edad, sexo, peso y altura
    const peso = parseFloat(formData.peso);
    const sexo = formData.sexo;
    const edad = parseInt(formData.edad);

    if (!peso || !edad) return;

    let grasaEstimada, aguaEstimada, masaMuscularEstimada;

    // Fórmulas aproximadas (deberás ajustar según tus necesidades)
    if (sexo === 'M') {
      grasaEstimada = (1.20 * parseFloat(formData.imc)) + (0.23 * edad) - 16.2;
      aguaEstimada = 60 - (grasaEstimada * 0.7);
      masaMuscularEstimada = peso * (1 - grasaEstimada / 100);
    } else {
      grasaEstimada = (1.20 * parseFloat(formData.imc)) + (0.23 * edad) - 5.4;
      aguaEstimada = 50 - (grasaEstimada * 0.7);
      masaMuscularEstimada = peso * (1 - grasaEstimada / 100);
    }

    setFormData(prev => ({
      ...prev,
      grasa_corporal: grasaEstimada.toFixed(2),
      agua_corporal: aguaEstimada.toFixed(2),
      masa_muscular: masaMuscularEstimada.toFixed(2)
    }));
  };

  const handleAlumnoChange = (e) => {
    const alumnoId = e.target.value;
    setSelectedAlumno(alumnoId);
    
    // Cargar datos del alumno para cálculos
    const alumno = alumnos.find(a => a.id == alumnoId);
    if (alumno) {
      const edad = calcularEdad(alumno.fecha_nacimiento);
      setFormData(prev => ({
        ...prev,
        edad,
        sexo: alumno.sexo
      }));
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAlumno) {
      alert('Selecciona un alumno');
      return;
    }

    try {
      await medicionesService.create({
        id_alumno: selectedAlumno,
        fecha: formData.fecha,
        peso: parseFloat(formData.peso),
        altura: parseFloat(formData.altura),
        cintura: parseFloat(formData.cintura) || null,
        cadera: parseFloat(formData.cadera) || null,
        brazo: parseFloat(formData.brazo) || null,
        pierna: parseFloat(formData.pierna) || null,
        grasa_corporal: parseFloat(formData.grasa_corporal) || null,
        agua_corporal: parseFloat(formData.agua_corporal) || null,
        masa_muscular: parseFloat(formData.masa_muscular) || null,
        imc: parseFloat(formData.imc),
        balanza_manual: !usarBalanza,
        notas: formData.notas
      });

      alert('Medición guardada correctamente');
      setShowForm(false);
      resetForm();
      loadMediciones(selectedAlumno);
    } catch (error) {
      console.error('Error guardando medición:', error);
      alert('Error al guardar medición');
    }
  };

  const resetForm = () => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      peso: '',
      altura: '',
      cintura: '',
      cadera: '',
      brazo: '',
      pierna: '',
      grasa_corporal: '',
      agua_corporal: '',
      masa_muscular: '',
      imc: '',
      notas: ''
    });
    setUsarBalanza(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta medición?')) {
      try {
        await medicionesService.delete(id);
        loadMediciones(selectedAlumno);
      } catch (error) {
        console.error('Error eliminando medición:', error);
        alert('Error al eliminar medición');
      }
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h1>Gestión de Mediciones</h1>

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

      {selectedAlumno && (
        <>
          <div style={styles.header}>
            <h2>Mediciones del alumno</h2>
            <button onClick={() => setShowForm(!showForm)} style={styles.addBtn}>
              {showForm ? 'Cancelar' : '+ Nueva Medición'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} style={styles.form}>
              <h3>Nueva Medición</h3>

              <div style={styles.formGroup}>
                <label style={styles.label}>Fecha:</label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.row}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Peso (kg): *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.peso}
                    onChange={(e) => setFormData({...formData, peso: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Altura (cm): *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.altura}
                    onChange={(e) => setFormData({...formData, altura: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>IMC (calculado):</label>
                  <input
                    type="text"
                    value={formData.imc}
                    style={{...styles.input, backgroundColor: '#f0f0f0'}}
                    readOnly
                  />
                </div>
              </div>

              <div style={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={usarBalanza}
                    onChange={(e) => setUsarBalanza(e.target.checked)}
                  />
                  {' '}Usar datos de balanza inteligente
                </label>
              </div>

              {usarBalanza ? (
                <div style={styles.balanzaSection}>
                  <h4>Datos de la balanza</h4>
                  <div style={styles.row}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Grasa corporal (%):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.grasa_corporal}
                        onChange={(e) => setFormData({...formData, grasa_corporal: e.target.value})}
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Agua corporal (%):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.agua_corporal}
                        onChange={(e) => setFormData({...formData, agua_corporal: e.target.value})}
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Masa muscular (kg):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.masa_muscular}
                        onChange={(e) => setFormData({...formData, masa_muscular: e.target.value})}
                        style={styles.input}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={styles.estimacionSection}>
                  <h4>Estimaciones calculadas</h4>
                  <p style={styles.infoText}>
                    Los valores se calculan automáticamente basándose en peso, altura, edad y sexo.
                  </p>
                  <div style={styles.row}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Grasa corporal estimada (%):</label>
                      <input
                        type="text"
                        value={formData.grasa_corporal}
                        style={{...styles.input, backgroundColor: '#f0f0f0'}}
                        readOnly
                      />
                    </div>
                                    <div style={styles.formGroup}>
                      <label style={styles.label}>Agua corporal estimada (%):</label>
                      <input
                        type="text"
                        value={formData.agua_corporal}
                        style={{...styles.input, backgroundColor: '#f0f0f0'}}
                        readOnly
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Masa muscular estimada (kg):</label>
                      <input
                        type="text"
                        value={formData.masa_muscular}
                        style={{...styles.input, backgroundColor: '#f0f0f0'}}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              )}

              <h4>Medidas corporales (opcional)</h4>
              <div style={styles.row}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Cintura (cm):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cintura}
                    onChange={(e) => setFormData({...formData, cintura: e.target.value})}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Cadera (cm):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cadera}
                    onChange={(e) => setFormData({...formData, cadera: e.target.value})}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Brazo (cm):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.brazo}
                    onChange={(e) => setFormData({...formData, brazo: e.target.value})}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Muslo (cm):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pierna}
                    onChange={(e) => setFormData({...formData, pierna: e.target.value})}
                    style={styles.input}
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
                Guardar Medición
              </button>
            </form>
          )}

          <div style={styles.tableContainer}>
            <h3>Historial de Mediciones</h3>
            {mediciones.length === 0 ? (
              <p>No hay mediciones registradas para este alumno.</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Fecha</th>
                    <th style={styles.th}>Peso</th>
                    <th style={styles.th}>Altura</th>
                    <th style={styles.th}>IMC</th>
                    <th style={styles.th}>Grasa %</th>
                    <th style={styles.th}>Agua %</th>
                    <th style={styles.th}>Masa Musc.</th>
                    <th style={styles.th}>Cintura</th>
                    <th style={styles.th}>Cadera</th>
                    <th style={styles.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {mediciones.map(medicion => (
                    <tr key={medicion.id}>
                      <td style={styles.td}>{new Date(medicion.fecha).toLocaleDateString()}</td>
                      <td style={styles.td}>{medicion.peso} kg</td>
                      <td style={styles.td}>{medicion.altura} cm</td>
                      <td style={styles.td}>{medicion.imc}</td>
                      <td style={styles.td}>{medicion.grasa_corporal ? `${medicion.grasa_corporal}%` : '-'}</td>
                      <td style={styles.td}>{medicion.agua_corporal ? `${medicion.agua_corporal}%` : '-'}</td>
                      <td style={styles.td}>{medicion.masa_muscular ? `${medicion.masa_muscular} kg` : '-'}</td>
                      <td style={styles.td}>{medicion.cintura ? `${medicion.cintura} cm` : '-'}</td>
                      <td style={styles.td}>{medicion.cadera ? `${medicion.cadera} cm` : '-'}</td>
                      <td style={styles.td}>
                        <button onClick={() => handleDelete(medicion.id)} style={styles.deleteBtn}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
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
  checkboxGroup: {
    marginBottom: '20px',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px'
  },
  balanzaSection: {
    backgroundColor: '#e8f4f8',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  estimacionSection: {
    backgroundColor: '#fff3cd',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  infoText: {
    fontSize: '13px',
    color: '#856404',
    marginBottom: '15px'
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
    borderCollapse: 'collapse',
    marginTop: '15px'
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

export default Mediciones;

