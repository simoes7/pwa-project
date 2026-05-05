import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const useWindowWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return width;
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, authError } = useAuth();
  const navigate = useNavigate();
  const width = useWindowWidth();
  const isMobile = width <= 768;
  const isSmallMobile = width <= 480;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = await login(email, password);
    if (user) {
      if (user.role === 'super_admin') {
        navigate('/super-admin');
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  };

  const dynamicStyles = {
    loginCard: {
      ...styles.loginCard,
      padding: isSmallMobile ? '1.5rem' : isMobile ? '2rem' : '3rem',
    },
    logoTitle: {
      ...styles.logoTitle,
      fontSize: isSmallMobile ? '1.5rem' : '2rem',
    }
  };

  return (
    <div className="bg-ethereal-flow" style={styles.pageWrap}>
      <main style={styles.main}>
        <div style={styles.loginWrapper}>

          {/* Background Blur Orbs */}
          <div style={styles.blurTop}></div>
          <div style={styles.blurBottom}></div>

          {/* Login Card */}
          <div className="glass-card" style={dynamicStyles.loginCard}>
            <div style={styles.cardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <Logo className="w-10 h-10" />
                <h1 className="headline text-gradient" style={{ ...dynamicStyles.logoTitle, marginBottom: 0 }}>Smart Queue</h1>
              </div>
              <p style={styles.logoSubtitle}>Experience the ethereal flow.</p>
            </div>

            {authError && <div style={styles.errorBanner}>{authError}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label} htmlFor="email">Email</label>
                <div style={styles.inputWrapper}>
                  <input
                    className="headline"
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.input}
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <div style={styles.labelRow}>
                  <label style={styles.label} htmlFor="password">Password</label>
                  <Link to="#" style={styles.forgotLink}>Forgot?</Link>
                </div>
                <div style={styles.inputWrapper}>
                  <input
                    className="headline"
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.input}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div style={styles.submitArea}>
                <button type="submit" className="primary-gradient" style={styles.submitBtn}>
                  <span>Get Started</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>arrow_forward</span>
                </button>
              </div>
            </form>

            <div style={styles.registerPrompt}>
              <p style={styles.promptText}>
                New here?
                <Link to="/register" style={styles.registerLink}>Register</Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer style={styles.footer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Logo className="w-6 h-6 grayscale opacity-50" />
          <div className="headline" style={styles.footerLogo}>Smart Queue</div>
        </div>
        <div style={styles.footerContent}>
          <div style={styles.footerLinks}>
            <Link to="#" style={styles.footerLink}>Privacy</Link>
            <Link to="#" style={styles.footerLink}>Terms</Link>
            <Link to="#" style={styles.footerLink}>Contact</Link>
          </div>
          <p style={styles.copyright}>© 2024 Smart Queue.</p>
        </div>
      </footer>
    </div>
  );
};

const styles = {
  pageWrap: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflowX: 'hidden',
    paddingTop: '80px',
    backgroundColor: 'var(--background)'
  },
  main: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem'
  },
  loginWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: '480px'
  },
  blurTop: {
    position: 'absolute',
    top: '-3rem',
    left: '-3rem',
    width: '16rem',
    height: '16rem',
    backgroundColor: 'rgba(0, 85, 215, 0.08)',
    borderRadius: '50%',
    filter: 'blur(48px)',
    zIndex: -1
  },
  blurBottom: {
    position: 'absolute',
    bottom: '-3rem',
    right: '-3rem',
    width: '16rem',
    height: '16rem',
    backgroundColor: 'rgba(116, 47, 229, 0.08)',
    borderRadius: '50%',
    filter: 'blur(48px)',
    zIndex: -1
  },
  loginCard: {
    backgroundColor: 'white',
    padding: '3rem',
    borderRadius: '1.5rem',
    boxShadow: '0 40px 80px rgba(13, 52, 89, 0.06)',
    border: '1px solid rgba(148, 180, 224, 0.1)'
  },
  cardHeader: {
    textAlign: 'center',
    marginBottom: '2.5rem'
  },
  logoTitle: {
    fontSize: '2rem',
    fontWeight: '800',
    letterSpacing: '-0.05em',
    marginBottom: '0.5rem'
  },
  logoSubtitle: {
    color: 'var(--on-surface-variant)',
    fontWeight: '500',
    fontSize: '1rem'
  },
  errorBanner: {
    backgroundColor: 'rgba(172, 49, 73, 0.05)',
    color: 'var(--error)',
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    marginBottom: '1.5rem',
    textAlign: 'center',
    fontWeight: '600',
    border: '1px solid rgba(172, 49, 73, 0.1)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: '0.25rem'
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '700',
    color: 'var(--on-surface)',
    letterSpacing: '0.025em',
    fontFamily: '"Plus Jakarta Sans", sans-serif'
  },
  forgotLink: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--primary)',
    textDecoration: 'none'
  },
  inputWrapper: {
    position: 'relative'
  },
  input: {
    width: '100%',
    height: '3.5rem',
    padding: '0 1.5rem',
    borderRadius: '0.75rem',
    backgroundColor: 'var(--surface-container-low)',
    border: '2px solid transparent',
    fontSize: '1rem',
    color: 'var(--on-surface)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
    boxSizing: 'border-box'
  },
  submitArea: {
    paddingTop: '1rem'
  },
  submitBtn: {
    width: '100%',
    height: '3.5rem',
    borderRadius: '1rem',
    color: 'white',
    fontWeight: '700',
    fontSize: '1.125rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    border: 'none',
    boxShadow: '0 10px 20px rgba(0, 85, 215, 0.2)',
    transition: 'transform 0.2s',
    fontFamily: '"Plus Jakarta Sans", sans-serif'
  },
  registerPrompt: {
    marginTop: '2.5rem',
    paddingTop: '2.5rem',
    borderTop: '1px solid var(--surface-container-high)',
    textAlign: 'center'
  },
  promptText: {
    fontSize: '0.875rem',
    color: 'var(--on-surface-variant)'
  },
  registerLink: {
    marginLeft: '0.5rem',
    fontWeight: '800',
    color: 'var(--primary)',
    textDecoration: 'none'
  },
  footer: {
    width: '100%',
    padding: '2rem 1.5rem',
    backgroundColor: 'var(--surface-container-low)',
    borderTop: '1px solid rgba(148, 180, 224, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem'
  },
  footerLogo: {
    fontSize: '1rem',
    fontWeight: '800',
    color: 'var(--inverse-on-surface)'
  },
  footerContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem'
  },
  footerLinks: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  footerLink: {
    fontSize: '0.625rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--inverse-on-surface)',
    textDecoration: 'none',
    opacity: 0.8
  },
  copyright: {
    fontSize: '0.625rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--inverse-on-surface)',
    opacity: 0.6
  }
};

export default LoginPage;
