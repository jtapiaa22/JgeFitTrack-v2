import { Link, useNavigate } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <h2 style={styles.logo}>JgeFiTrack</h2>
        
        <div style={styles.links}>
          <Link to="/dashboard" style={styles.link}>Dashboard</Link>
          <Link to="/alumnos" style={styles.link}>Alumnos</Link>
          <Link to="/mediciones" style={styles.link}>Mediciones</Link>
          <Link to="/pagos" style={styles.link}>Pagos</Link>
        </div>

        <div style={styles.userSection}>
          <span style={styles.userName}>{user?.nombre}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    backgroundColor: '#2c3e50',
    padding: '1rem 0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px'
  },
  logo: {
    color: 'white',
    margin: 0
  },
  links: {
    display: 'flex',
    gap: '20px'
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    transition: 'background 0.3s'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  userName: {
    color: 'white'
  },
  logoutBtn: {
    padding: '8px 16px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};

export default Navbar;
