import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function RegistrarProfesor() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    dni: '',
    nombre: '',
    email: '',
    usuario: '',
    contrasenia: '',
    confirmarContrasenia: '',
    dias_prueba: 30 // NUEVO CAMPO
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔹 Maneja el cambio de inputs
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔹 Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones básicas
    if (formData.contrasenia !== formData.confirmarContrasenia) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.contrasenia.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3001/api/clientes',
        {
          dni: formData.dni,
          nombre: formData.nombre,
          email: formData.email,
          usuario: formData.usuario,
          contrasenia: formData.contrasenia,
          rol: 'profesor',
          dias_prueba: parseInt(formData.dias_prueba) // NUEVO DATO
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('✅ Profesor registrado exitosamente');
      navigate('/admin/profesores');
    } catch (err) {
      console.error('Error registrando profesor:', err);
      setError(
        err.response?.data?.error ||
          'Error al registrar profesor. Verifica que el DNI, email y usuario no estén duplicados.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate('/admin/profesores');

  return (
    <div>
      {/* Encabezado */}
      <div style={styles.header}>
        <h1>Registrar Nuevo Profesor</h1>
        <button onClick={handleCancel} style={styles.cancelBtn}>
          ← Volver a Profesores
        </button>
      </div>

      {/* Formulario */}
      <div style={styles.formContainer}>
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.errorBox}>⚠️ {error}</div>}

          {/* DNI */}
          <div style={styles.formGroup}>
            <label style={styles.label}>DNI: *</label>
            <input
              type="text"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              style={styles.input}
              placeholder="12345678"
              required
            />
          </div>

          {/* Nombre */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Nombre Completo: *</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              style={styles.input}
              placeholder="Juan Pérez"
              required
            />
          </div>

          {/* Email */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Email: *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
              placeholder="juan@ejemplo.com"
              required
            />
          </div>

          {/* Usuario */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Usuario: *</label>
            <input
              type="text"
              name="usuario"
              value={formData.usuario}
              onChange={handleChange}
              style={styles.input}
              placeholder="juanperez"
              required
            />
            <small style={styles.hint}>
              Este será el nombre de usuario para iniciar sesión
            </small>
          </div>

          {/* Contraseñas */}
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Contraseña: *</label>
              <input
                type="password"
                name="contrasenia"
                value={formData.contrasenia}
                onChange={handleChange}
                style={styles.input}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Confirmar Contraseña: *</label>
              <input
                type="password"
                name="confirmarContrasenia"
                value={formData.confirmarContrasenia}
                onChange={handleChange}
                style={styles.input}
                placeholder="Repetir contraseña"
                required
                minLength={6}
              />
            </div>
          </div>

          {/* NUEVO: Período de prueba */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Período de Prueba (días): *</label>
            <input
              type="number"
              name="dias_prueba"
              value={formData.dias_prueba}
              onChange={handleChange}
              style={styles.input}
              min="1"
              max="365"
              required
            />
            <small style={styles.hint}>
              El profesor tendrá acceso gratuito durante este período
            </small>
          </div>

          {/* Información */}
          <div style={styles.infoBox}>
            <strong>ℹ️ Información importante:</strong>
            <ul style={styles.infoList}>
              <li>El profesor tendrá acceso inmediato al sistema</li>
              <li>Podrá gestionar sus propios alumnos, mediciones y pagos</li>
              <li>
                Puedes activar o desactivar su cuenta desde el panel de
                administración
              </li>
              <li>La contraseña será encriptada de forma segura</li>
            </ul>
          </div>

          {/* Botones */}
          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={handleCancel}
              style={styles.cancelButton}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Registrar Profesor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 🎨 Estilos
const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  formContainer: {
    maxWidth: '700px',
    margin: '0 auto'
  },
  form: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  errorBox: {
    backgroundColor: '#fee',
    border: '1px solid #e74c3c',
    padding: '15px',
    borderRadius: '4px',
    marginBottom: '20px',
    color: '#c0392b',
    fontSize: '14px'
  },
  formGroup: {
    marginBottom: '20px',
    flex: 1
  },
  row: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#2c3e50'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
    transition: 'border 0.3s'
  },
  hint: {
    display: 'block',
    marginTop: '5px',
    fontSize: '12px',
    color: '#7f8c8d'
  },
  infoBox: {
    backgroundColor: '#d5f4e6',
    border: '1px solid #27ae60',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '25px',
    fontSize: '14px',
    color: '#27ae60'
  },
  infoList: {
    marginTop: '10px',
    marginLeft: '20px',
    lineHeight: '1.8'
  },
  buttonGroup: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'flex-end'
  },
  cancelButton: {
    padding: '12px 30px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  submitBtn: {
    padding: '12px 30px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  }
};

export default RegistrarProfesor;
