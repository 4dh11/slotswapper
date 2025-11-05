import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const tabs = [
    { name: 'Dashboard', path: '/' },
    { name: 'Marketplace', path: '/marketplace' },
    { name: 'Requests', path: '/requests' },
  ];

  return (
    <nav style={styles.nav}>
      <style>{`
        @keyframes underlineSlide {
          from {
            width: 0;
            left: 0;
          }
          to {
            width: 100%;
            left: 0;
          }
        }
      `}</style>
      <div style={styles.container}>
        {/* Logo */}
        <Link to="/" style={styles.logo}>
          SlotSwapper
        </Link>

        {/* Navigation Links */}
        <div style={styles.links}>
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                style={{
                  ...styles.link,
                  ...(isActive ? styles.linkActive : {}),
                }}
              >
                {tab.name}
                {isActive && <div style={styles.underline}></div>}
              </Link>
            );
          })}
        </div>

        {/* User & Logout */}
        <div style={styles.userSection}>
          <span style={styles.userName}>Hi, {user.name}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0.75rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1f2937',
    textDecoration: 'none',
    cursor: 'pointer',
    minWidth: '150px',
    letterSpacing: '-0.5px',
  },
  links: {
    display: 'flex',
    gap: '2.5rem',
    flex: 1,
    justifyContent: 'center',
  },
  link: {
    color: '#6b7280',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '0.95rem',
    transition: 'color 0.2s',
    cursor: 'pointer',
    position: 'relative',
    paddingBottom: '0.5rem',
    letterSpacing: '0.3px',
  },
  linkActive: {
    color: '#10b981',
    fontWeight: '600',
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: '2px',
    backgroundColor: '#10b981',
    width: '100%',
    animation: 'underlineSlide 0.4s ease-out forwards',
    borderRadius: '1px',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  userName: {
    fontWeight: '600',
    color: '#1f2937',
    fontSize: '0.95rem',
  },
  logoutBtn: {
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 1.25rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.95rem',
    transition: 'background 0.2s, transform 0.2s',
  },
};
