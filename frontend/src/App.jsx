import { useState, useEffect } from 'react';
import Login from './components/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Al cargar, verifica si hay token guardado
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogin = (data) => {
    setIsAuthenticated(true);
    setUser(data.cliente);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Bienvenido, {user?.nombre}!</h1>
      <p>Usuario: {user?.usuario}</p>
      <button onClick={handleLogout} style={styles.logoutButton}>
        Cerrar Sesión
      </button>
    </div>
  );
}

const styles = {
  logoutButton: {
    padding: '10px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  }
};

export default App;
