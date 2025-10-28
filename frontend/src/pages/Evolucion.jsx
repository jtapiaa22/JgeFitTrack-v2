import { useState, useEffect } from 'react';
import { alumnosService, medicionesService } from '../services/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Evolucion() {
  const [alumnos, setAlumnos] = useState([]);
  const [selectedAlumno, setSelectedAlumno] = useState('');
  const [mediciones, setMediciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alumnoInfo, setAlumnoInfo] = useState(null);

  useEffect(() => {
    loadAlumnos();
  }, []);

  useEffect(() => {
    if (selectedAlumno) {
      loadMediciones(selectedAlumno);
    }
  }, [selectedAlumno]);

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
    const medicionesOrdenadas = response.data.sort((a, b) => 
      new Date(a.fecha_medicion) - new Date(b.fecha_medicion)
    );
    setMediciones(medicionesOrdenadas);

    // Obtener info del alumno
    const alumno = alumnos.find(a => a.id === parseInt(id_alumno));
    setAlumnoInfo(alumno);
  } catch (error) {
    console.error('Error cargando mediciones:', error);
    setMediciones([]);
  }
};


  const formatearFecha = (fecha) => {
    const date = new Date(fecha);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  // Preparar datos para gráfico de peso
  const dataPeso = mediciones.map(m => ({
    fecha: formatearFecha(m.fecha_medicion),
    peso: parseFloat(m.peso),
    imc: parseFloat(m.imc)
  }));

  // Preparar datos para gráfico de composición corporal
  const dataComposicion = mediciones.map(m => ({
    fecha: formatearFecha(m.fecha_medicion),
    grasa: m.usa_balanza && m.grasa_corporal_balanza 
      ? parseFloat(m.grasa_corporal_balanza) 
      : m.grasa_corporal_estimada 
        ? parseFloat(m.grasa_corporal_estimada) 
        : null,
    agua: m.agua_corporal_balanza ? parseFloat(m.agua_corporal_balanza) : null,
    musculo: m.masa_muscular_balanza ? parseFloat(m.masa_muscular_balanza) : null
  }));

  // Calcular estadísticas
  const calcularEstadisticas = () => {
    if (mediciones.length === 0) return null;

    const pesos = mediciones.map(m => parseFloat(m.peso));
    const pesoInicial = pesos[0];
    const pesoActual = pesos[pesos.length - 1];
    const diferencia = pesoActual - pesoInicial;
    const porcentajeCambio = ((diferencia / pesoInicial) * 100).toFixed(1);

    const imcs = mediciones.map(m => parseFloat(m.imc));
    const imcInicial = imcs[0];
    const imcActual = imcs[imcs.length - 1];
    const diferenciaIMC = (imcActual - imcInicial).toFixed(1);

    return {
      pesoInicial: pesoInicial.toFixed(1),
      pesoActual: pesoActual.toFixed(1),
      diferencia: diferencia.toFixed(1),
      porcentajeCambio,
      imcInicial: imcInicial.toFixed(1),
      imcActual: imcActual.toFixed(1),
      diferenciaIMC,
      totalMediciones: mediciones.length
    };
  };

  const stats = calcularEstadisticas();

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h1>📈 Evolución y Progreso</h1>

      {/* Selector de alumno */}
      <div style={styles.selectorContainer}>
        <label style={styles.label}>Selecciona un alumno para ver su evolución:</label>
        <select
          value={selectedAlumno}
          onChange={(e) => setSelectedAlumno(e.target.value)}
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

      {selectedAlumno && alumnoInfo && (
        <>
          {/* Información del alumno */}
          <div style={styles.alumnoInfoCard}>
            <h2>{alumnoInfo.nombre}</h2>
            <div style={styles.alumnoDetails}>
              <span><strong>DNI:</strong> {alumnoInfo.dni}</span>
              <span><strong>Sexo:</strong> {alumnoInfo.sexo === 'M' ? 'Masculino' : 'Femenino'}</span>
              <span><strong>Edad:</strong> {calcularEdad(alumnoInfo.fecha_nacimiento)} años</span>
              <span><strong>Altura:</strong> {mediciones.length > 0 ? mediciones[mediciones.length - 1].altura + ' cm' : '-'}</span>
            </div>
          </div>

          {mediciones.length === 0 ? (
            <div style={styles.noData}>
              <p>📊 No hay mediciones registradas para este alumno aún.</p>
            </div>
          ) : (
            <>
              {/* Estadísticas resumidas */}
              {stats && (
                <div style={styles.statsContainer}>
                  <div style={styles.statCard}>
                    <h3>Peso</h3>
                    <div style={styles.statValue}>
                      {stats.pesoInicial} kg → {stats.pesoActual} kg
                    </div>
                    <div style={{
                      ...styles.statChange,
                      color: parseFloat(stats.diferencia) < 0 ? '#27ae60' : parseFloat(stats.diferencia) > 0 ? '#e74c3c' : '#95a5a6'
                    }}>
                      {parseFloat(stats.diferencia) > 0 ? '▲' : parseFloat(stats.diferencia) < 0 ? '▼' : '='} {Math.abs(stats.diferencia)} kg ({stats.porcentajeCambio}%)
                    </div>
                  </div>

                  <div style={styles.statCard}>
                    <h3>IMC</h3>
                    <div style={styles.statValue}>
                      {stats.imcInicial} → {stats.imcActual}
                    </div>
                    <div style={{
                      ...styles.statChange,
                      color: parseFloat(stats.diferenciaIMC) < 0 ? '#27ae60' : parseFloat(stats.diferenciaIMC) > 0 ? '#e74c3c' : '#95a5a6'
                    }}>
                      {parseFloat(stats.diferenciaIMC) > 0 ? '▲' : parseFloat(stats.diferenciaIMC) < 0 ? '▼' : '='} {Math.abs(stats.diferenciaIMC)}
                    </div>
                  </div>

                  <div style={styles.statCard}>
                    <h3>Total Mediciones</h3>
                    <div style={styles.statValue}>{stats.totalMediciones}</div>
                    <div style={styles.statChange}>registradas</div>
                  </div>

                  <div style={styles.statCard}>
                    <h3>Período</h3>
                    <div style={styles.statValue}>
                      {Math.floor((new Date(mediciones[mediciones.length - 1].fecha_medicion) - new Date(mediciones[0].fecha_medicion)) / (1000 * 60 * 60 * 24))} días
                    </div>
                    <div style={styles.statChange}>de seguimiento</div>
                  </div>
                </div>
              )}

              {/* Gráfico de evolución de Peso */}
              <div style={styles.chartContainer}>
                <h3>📊 Evolución del Peso</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dataPeso}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="peso" 
                      stroke="#3498db" 
                      strokeWidth={3}
                      name="Peso (kg)"
                      dot={{ fill: '#3498db', r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfico de evolución de IMC */}
              <div style={styles.chartContainer}>
                <h3>📊 Evolución del IMC</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dataPeso}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" />
                    <YAxis domain={[15, 35]} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="imc" 
                      stroke="#e74c3c" 
                      strokeWidth={3}
                      name="IMC"
                      dot={{ fill: '#e74c3c', r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div style={styles.imcReference}>
                  <span style={{color: '#3498db'}}>● Bajo peso (&lt;18.5)</span>
                  <span style={{color: '#27ae60'}}>● Normal (18.5-24.9)</span>
                  <span style={{color: '#f39c12'}}>● Sobrepeso (25-29.9)</span>
                  <span style={{color: '#e74c3c'}}>● Obesidad (≥30)</span>
                </div>
              </div>

              {/* Gráfico de composición corporal */}
              {dataComposicion.some(d => d.grasa !== null || d.agua !== null || d.musculo !== null) && (
                <div style={styles.chartContainer}>
                  <h3>📊 Composición Corporal</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dataComposicion}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      {dataComposicion.some(d => d.grasa !== null) && (
                        <Bar dataKey="grasa" fill="#e74c3c" name="Grasa corporal (%)" />
                      )}
                      {dataComposicion.some(d => d.agua !== null) && (
                        <Bar dataKey="agua" fill="#3498db" name="Agua corporal (%)" />
                      )}
                      {dataComposicion.some(d => d.musculo !== null) && (
                        <Bar dataKey="musculo" fill="#27ae60" name="Masa muscular (%)" />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Tabla de mediciones */}
              <div style={styles.tableContainer}>
                <h3>📋 Historial de Mediciones</h3>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Fecha</th>
                      <th style={styles.th}>Peso (kg)</th>
                      <th style={styles.th}>IMC</th>
                      <th style={styles.th}>Grasa (%)</th>
                      <th style={styles.th}>Agua (%)</th>
                      <th style={styles.th}>Músculo (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mediciones.map((m, index) => (
                      <tr key={m.id} style={index === mediciones.length - 1 ? styles.lastRow : {}}>
                        <td style={styles.td}>{formatearFecha(m.fecha_medicion)}</td>
                        <td style={styles.td}><strong>{m.peso}</strong></td>
                        <td style={styles.td}>{m.imc}</td>
                        <td style={styles.td}>
                          {m.usa_balanza && m.grasa_corporal_balanza 
                            ? m.grasa_corporal_balanza 
                            : m.grasa_corporal_estimada 
                              ? `~${m.grasa_corporal_estimada}`
                              : '-'}
                        </td>
                        <td style={styles.td}>{m.agua_corporal_balanza || '-'}</td>
                        <td style={styles.td}>{m.masa_muscular_balanza || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {!selectedAlumno && (
        <div style={styles.noData}>
          <p>👆 Selecciona un alumno para ver sus gráficos de evolución</p>
        </div>
      )}
    </div>
  );
}

// Función helper para calcular edad
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

const styles = {
  selectorContainer: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  label: {
    display: 'block',
    marginBottom: '10px',
    fontWeight: 'bold',
    fontSize: '16px'
  },
  select: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #3498db',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    outline: 'none'
  },
  alumnoInfoCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    borderLeft: '4px solid #3498db'
  },
  alumnoDetails: {
    display: 'flex',
    gap: '30px',
    marginTop: '15px',
    flexWrap: 'wrap',
    fontSize: '14px',
    color: '#555'
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '30px'
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2c3e50',
    margin: '10px 0'
  },
  statChange: {
    fontSize: '14px',
    fontWeight: 'bold'
  },
  chartContainer: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  imcReference: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginTop: '15px',
    fontSize: '13px',
    flexWrap: 'wrap'
  },
  tableContainer: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
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
  lastRow: {
    backgroundColor: '#e8f5e9',
    fontWeight: 'bold'
  },
  noData: {
    backgroundColor: 'white',
    padding: '60px 20px',
    borderRadius: '8px',
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: '18px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  }
};

export default Evolucion;
