import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
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

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const { register, authError, loginWithGoogle, setAuthError } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const width = useWindowWidth();
  const isMobile = width <= 768;
  const isSmallMobile = width <= 480;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showAlert("Passwords do not match!", "Registration Error", "error");
      return;
    }
    if (password.length < 8) {
      showAlert("Password must be at least 8 characters long!", "Weak Password", "warning");
      return;
    }
    if (!agreeTerms) {
      showAlert("Please agree to the Terms of Service.", "Agreement Required", "info");
      return;
    }
    const user = await register(name, email, password);
    if (user) {
      navigate('/');
    }
  };

  const dynamicStyles = {
    main: {
      ...styles.main,
      padding: isMobile ? '2rem 1rem' : '3rem 1.5rem',
    },
    registerCard: {
      ...styles.registerCard,
      padding: isSmallMobile ? '1.5rem' : isMobile ? '2rem' : '3rem',
    },
    benefitsGrid: {
      ...styles.benefitsGrid,
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
      gap: isMobile ? '0.75rem' : '1rem',
    },
    logoTitle: {
      ...styles.logoTitle,
      fontSize: isSmallMobile ? '1.5rem' : '2rem',
    }
  };

  return (
    <div style={styles.pageWrap}>
      {/* Decorative Background Accents */}
      <div style={styles.bgAccents}>
        <div style={styles.accentTop}></div>
        <div style={styles.accentBottom}></div>
      </div>

      <main style={dynamicStyles.main}>
        <div style={styles.registerWrapper}>
          
          {/* Center Card */}
          <div className="glass-card" style={dynamicStyles.registerCard}>
            <div style={styles.cardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <Logo className="w-10 h-10" />
                <h1 className="headline text-gradient" style={{ ...dynamicStyles.logoTitle, marginBottom: 0 }}>Smart Queue</h1>
              </div>
              <p style={styles.logoSubtitle}>Create your account</p>
            </div>

            {authError && <div style={styles.errorBanner}>{authError}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
              
              {/* Name Field */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Name</label>
                <div style={styles.inputWrapper}>
                  <span className="material-symbols-outlined" style={styles.fieldIcon}>person</span>
                  <input 
                    className="headline"
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={styles.input}
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email</label>
                <div style={styles.inputWrapper}>
                  <span className="material-symbols-outlined" style={styles.fieldIcon}>mail</span>
                  <input 
                    className="headline"
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.input}
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              {/* Passwords Grid */}
              <div style={styles.passGrid}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Password</label>
                  <div style={styles.inputWrapper}>
                    <span className="material-symbols-outlined" style={styles.fieldIcon}>lock</span>
                    <input 
                      className="headline"
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={styles.input}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Confirm</label>
                  <div style={styles.inputWrapper}>
                    <span className="material-symbols-outlined" style={styles.fieldIcon}>shield_lock</span>
                    <input 
                      className="headline"
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={styles.input}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div style={styles.termsRow}>
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  style={styles.checkbox}
                />
                <label htmlFor="terms" style={styles.termsText}>
                  I agree to the <Link to="#" style={styles.inlineLink}>Terms</Link> and <Link to="#" style={styles.inlineLink}>Privacy Policy</Link>.
                </label>
              </div>

              {/* Primary Action */}
              <div style={styles.submitArea}>
                <button type="submit" className="primary-gradient" style={styles.submitBtn}>
                  Create Account
                </button>
              </div>

              {/* Divider */}
              <div style={styles.dividerContainer}>
                <div style={styles.dividerLine}></div>
                <span style={styles.dividerText}>OR</span>
                <div style={styles.dividerLine}></div>
              </div>

              {/* Google Login Button */}
              <div style={styles.socialLoginArea}>
                <button 
                  type="button" 
                  onClick={() => {
                    setAuthError('');
                    loginWithGoogle();
                  }}
                  style={styles.googleBtn}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '0.75rem' }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </div>

              {/* Secondary Navigation */}
              <div style={styles.loginPrompt}>
                <p style={styles.promptText}>
                  Already have an account? 
                  <Link to="/login" style={styles.loginLink}>Login</Link>
                </p>
              </div>
            </form>
          </div>

          {/* Side Benefits */}
          <div style={dynamicStyles.benefitsGrid}>
            <div style={styles.benefitItem}>
              <span className="material-symbols-outlined" style={styles.benefitIcon}>bolt</span>
              INSTANT SETUP
            </div>
            <div style={styles.benefitItem}>
              <span className="material-symbols-outlined" style={styles.benefitIcon}>verified_user</span>
              SECURE DATA
            </div>
            <div style={styles.benefitItem}>
              <span className="material-symbols-outlined" style={styles.benefitIcon}>support_agent</span>
              24/7 SUPPORT
            </div>
          </div>
        </div>
      </main>

      <footer style={styles.footer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Logo className="w-6 h-6 grayscale opacity-50" />
          <div className="headline" style={styles.footerLogo}>Smart Queue</div>
        </div>
        <div style={styles.footerLinks}>
          <Link to="#" style={styles.footerSubLink}>Privacy</Link>
          <Link to="#" style={styles.footerSubLink}>Terms</Link>
          <Link to="#" style={styles.footerSubLink}>Contact</Link>
        </div>
        <p style={styles.copyright}>© 2024 Smart Queue.</p>
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
  bgAccents: {
    position: 'fixed',
    inset: 0,
    zIndex: -1,
    overflow: 'hidden',
    pointerEvents: 'none'
  },
  accentTop: {
    position: 'absolute',
    top: '-10%',
    left: '-10%',
    width: '40%',
    height: '40%',
    backgroundColor: 'rgba(0, 85, 215, 0.1)',
    borderRadius: '50%',
    filter: 'blur(120px)'
  },
  accentBottom: {
    position: 'absolute',
    bottom: '-10%',
    right: '-10%',
    width: '40%',
    height: '40%',
    backgroundColor: 'rgba(116, 47, 229, 0.1)',
    borderRadius: '50%',
    filter: 'blur(120px)'
  },
  main: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1.5rem'
  },
  registerWrapper: {
    width: '100%',
    maxWidth: '36rem'
  },
  registerCard: {
    backgroundColor: 'white',
    padding: '3rem',
    borderRadius: '1.5rem',
    boxShadow: '0 8px 40px rgba(13, 52, 89, 0.06)',
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
    fontSize: '1rem',
    fontFamily: '"Plus Jakarta Sans", sans-serif'
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
  label: {
    fontSize: '0.875rem',
    fontWeight: '700',
    color: 'var(--on-surface)',
    paddingLeft: '0.25rem',
    fontFamily: '"Plus Jakarta Sans", sans-serif'
  },
  inputWrapper: {
    position: 'relative'
  },
  fieldIcon: {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--outline-variant)',
    fontSize: '1.25rem',
    pointerEvents: 'none'
  },
  input: {
    width: '100%',
    padding: '1rem 1rem 1rem 3rem',
    borderRadius: '0.75rem',
    backgroundColor: 'var(--surface-container-low)',
    border: 'none',
    fontSize: '1rem',
    color: 'var(--on-surface)',
    outline: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxSizing: 'border-box'
  },
  passGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '1rem'
  },
  termsRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '0.5rem 0.25rem'
  },
  checkbox: {
    width: '1.25rem',
    height: '1.25rem',
    borderRadius: '0.25rem',
    border: '2px solid var(--outline-variant)',
    cursor: 'pointer',
    accentColor: 'var(--primary)'
  },
  termsText: {
    fontSize: '0.875rem',
    color: 'var(--on-surface-variant)',
    fontWeight: '500',
    lineHeight: '1.2'
  },
  inlineLink: {
    color: 'var(--primary)',
    textDecoration: 'none',
    fontWeight: '600'
  },
  submitArea: {
    marginTop: '1rem'
  },
  submitBtn: {
    width: '100%',
    padding: '1rem',
    borderRadius: '1rem',
    color: 'white',
    fontWeight: '700',
    fontSize: '1rem',
    cursor: 'pointer',
    border: 'none',
    boxShadow: '0 10px 20px rgba(0, 85, 215, 0.2)',
    transition: 'all 0.3s',
    fontFamily: '"Plus Jakarta Sans", sans-serif'
  },
  dividerContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    margin: '1.5rem 0'
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: 'var(--outline-variant)'
  },
  dividerText: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--on-surface-variant)',
    fontFamily: '"Plus Jakarta Sans", sans-serif'
  },
  socialLoginArea: {
    marginTop: '0.5rem'
  },
  googleBtn: {
    width: '100%',
    padding: '0.875rem 1rem',
    borderRadius: '0.75rem',
    backgroundColor: 'white',
    border: '2px solid var(--outline-variant)',
    color: 'var(--on-surface)',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
  },
  loginPrompt: {
    textAlign: 'center',
    paddingTop: '1rem'
  },
  promptText: {
    fontSize: '0.875rem',
    color: 'var(--on-surface-variant)'
  },
  loginLink: {
    marginLeft: '0.5rem',
    fontWeight: '800',
    color: 'var(--primary)',
    textDecoration: 'none'
  },
  benefitsGrid: {
    marginTop: '2rem',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem'
  },
  benefitItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.75rem',
    fontWeight: '800',
    color: 'var(--outline)',
    letterSpacing: '0.1em'
  },
  benefitIcon: {
    fontSize: '1rem'
  },
  footer: {
    width: '100%',
    padding: '2rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    borderTop: '1px solid rgba(148, 180, 224, 0.1)',
    backgroundColor: 'var(--surface-container-low)'
  },
  footerLogo: {
    fontSize: '1rem',
    fontWeight: '800',
    color: 'var(--outline)',
    opacity: 0.8
  },
  footerLinks: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  footerSubLink: {
    fontSize: '0.625rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--outline)',
    textDecoration: 'none',
    opacity: 0.8
  },
  copyright: {
    fontSize: '0.625rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--outline)',
    opacity: 0.6
  }
};

export default RegisterPage;
