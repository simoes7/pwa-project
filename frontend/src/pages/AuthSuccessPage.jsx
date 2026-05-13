import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiPath } from '../config';

const AuthSuccessPage = () => {
  const navigate = useNavigate();
  const { handleGoogleAuthSuccess } = useAuth();

  const fetchedRef = React.useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    
    const fetchOAuthUser = async () => {
      fetchedRef.current = true;
      try {
        const response = await fetch(apiPath('/auth/oauth-user'), {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          handleGoogleAuthSuccess(data.user);
          if (data.user.role === 'super_admin') {
            navigate('/super-admin', { replace: true });
          } else if (data.user.role === 'admin') {
            navigate('/admin', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        } else {
          // If the user state is already set (from a previous successful fetch), don't redirect
          // Otherwise, redirect to register
          navigate('/register?error=no_user_data', { replace: true });
        }
      } catch (error) {
        console.error('Error fetching OAuth user:', error);
        navigate('/register?error=auth_failed', { replace: true });
      }
    };
    fetchOAuthUser();
  }, [navigate, handleGoogleAuthSuccess]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: 'var(--background)',
      fontFamily: '"Plus Jakarta Sans", sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid var(--outline-variant)',
          borderTop: '4px solid var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }}></div>
        <p style={{ color: 'var(--on-surface-variant)', fontWeight: '500' }}>
          Completing authentication...
        </p>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuthSuccessPage;
