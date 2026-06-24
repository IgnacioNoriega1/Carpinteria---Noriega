'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  Briefcase, 
  Receipt, 
  Boxes, 
  Database,
  Menu,
  Sun,
  Moon,
  LogOut,
  Lock,
  Hammer
} from 'lucide-react';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  
  // Login Form States
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Initialize Theme and Session
  useEffect(() => {
    // Theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    // Session Check
    const session = localStorage.getItem('carpentry_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        setIsAuthenticated(true);
        setUser({ username: parsed.username, role: parsed.role });
      } catch (e) {
        localStorage.removeItem('carpentry_session');
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  // Toggle Dark Mode
  const toggleTheme = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput }),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('carpentry_session', JSON.stringify({
          username: data.username,
          role: data.role,
          token: 'local-token-session'
        }));
        setUser({ username: data.username, role: data.role });
        setIsAuthenticated(true);
        router.refresh();
      } else {
        setLoginError(data.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      setLoginError('Error de conexión al servidor');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('carpentry_session');
    setIsAuthenticated(false);
    setUser(null);
    router.push('/');
  };

  if (isAuthenticated === null) {
    return (
      <div style={{ display: 'flex', width: '100vw', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0e0e11', color: '#f8fafc' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          <Hammer size={48} className="animate-bounce" style={{ color: '#f59e0b' }} />
          <p>Cargando Sistema...</p>
        </div>
      </div>
    );
  }

  // Render Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="login-screen" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        minHeight: '100vh',
        backgroundColor: darkMode ? '#0e0e11' : '#f8fafc',
        backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(245, 158, 11, 0.05) 0%, transparent 40%)',
        padding: '20px'
      }}>
        <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '35px', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px', textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '15px'
            }}>
              <Hammer size={32} />
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '5px' }}>Taller Familiar</h2>
            <p style={{ fontSize: '0.9rem' }}>Sistema de Gestión Integral para Carpintería</p>
          </div>

          {loginError && (
            <div style={{
              backgroundColor: 'var(--error-light)',
              color: 'var(--error-color)',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              marginBottom: '20px',
              border: '1px solid var(--error-color)'
            }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Usuario</label>
              <input
                type="text"
                className="form-control"
                placeholder="ej: admin"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: '25px' }}>
              <label>Contraseña</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontWeight: 600 }}
              disabled={loginLoading}
            >
              {loginLoading ? 'Iniciando sesión...' : 'Ingresar al Taller'}
            </button>
          </form>

          <div style={{ marginTop: '25px', textAlign: 'center' }}>
            <button
              onClick={toggleTheme}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.85rem'
              }}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              Cambiar a Modo {darkMode ? 'Claro' : 'Oscuro'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
    { label: 'Clientes', icon: <Users size={20} />, href: '/clientes' },
    { label: 'Proyectos', icon: <FolderKanban size={20} />, href: '/proyectos' },
    { label: 'Empleados', icon: <Briefcase size={20} />, href: '/empleados' },
    { label: 'Gastos Generales', icon: <Receipt size={20} />, href: '/gastos' },
    { label: 'Inventario / Stock', icon: <Boxes size={20} />, href: '/inventario' },
    { label: 'Copias de Seguridad', icon: <Database size={20} />, href: '/respaldos' },
  ];

  return (
    <div className={`app-container ${sidebarOpen ? 'sidebar-active' : ''}`} style={{ width: '100%' }}>
      {/* Sidebar Navigation */}
      <aside style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        width: 'var(--sidebar-width)',
        backgroundColor: 'var(--surface-color)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease'
      }}>
        {/* Sidebar Header Logo */}
        <div style={{
          height: 'var(--header-height)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '0 24px',
          borderBottom: '1px solid var(--border-color)',
          color: 'var(--primary-color)'
        }}>
          <Hammer size={24} />
          <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Taller Carpintería</span>
        </div>

        {/* Sidebar Navigation Links */}
        <nav style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1, overflowY: 'auto' }}>
          {menuItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.95rem',
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--primary-color)' : 'var(--text-secondary)',
                  backgroundColor: active ? 'var(--primary-light)' : 'transparent',
                  transition: 'all 0.2s ease'
                }}
                className="nav-link"
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer User Session Info */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          backgroundColor: 'var(--bg-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--primary-color)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}>
              {user?.username?.substring(0, 2)}
            </div>
            <div style={{ flexGrow: 1, overflow: 'hidden' }}>
              <p style={{ fontWeight: 600, fontSize: '0.85rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user?.username}
              </p>
              <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                {user?.role === 'admin' ? 'Administrador' : 'Operador'}
              </span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '8px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-color)',
              color: 'var(--error-color)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'background-color 0.2s ease'
            }}
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Container Wrapper */}
      <div className="main-content" style={{ marginLeft: sidebarOpen ? 'var(--sidebar-width)' : 0 }}>
        {/* App Header */}
        <header style={{
          height: 'var(--header-height)',
          backgroundColor: 'var(--surface-color)',
          borderBottom: '1px solid var(--border-color)',
          padding: '0 30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 99
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <Menu size={22} />
            </button>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Taller de Carpintería</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={toggleTheme}
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--surface-color)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.85rem'
              }}
            >
              {darkMode ? <Sun size={16} style={{ color: 'var(--primary-color)' }} /> : <Moon size={16} />}
              <span>{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
            </button>
          </div>
        </header>

        {/* Content Rendered here */}
        <main className="content-body">
          {children}
        </main>
      </div>
    </div>
  );
}
