// src/pages/Login.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import './Login.css';

// Credenziali di test
const TEST_CREDENTIALS = {
  email: 'utente@prova.com',
  password: 'Prova123!'
};

const Login = () => {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const isDarkTheme = theme.palette.mode === 'dark';
  
  // State per il controllo delle tab
  const [activeTab, setActiveTab] = useState('login');
  // State per il controllo delle notifiche
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  // State per i form
  const [loginFormData, setLoginFormData] = useState({ email: '', password: '', remember: false });
  const [registerFormData, setRegisterFormData] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '', 
    termsAccepted: false 
  });
  
  // Controlla se l'utente è già autenticato all'avvio (solo con "Ricordami" attivo)
  useEffect(() => {
    const checkAuthentication = () => {
      const storedUser = localStorage.getItem('testUser');
      if (storedUser) {
        const userInfo = JSON.parse(storedUser);
        // Se l'utente è autenticato e ha selezionato "Ricordami"
        if (userInfo.isAuthenticated && userInfo.remember) {
          console.log('Utente già autenticato con "Ricordami" attivo, reindirizzamento alla dashboard...');
          window.location.href = '/';
        }
      }
    };
    
    checkAuthentication();
  }, []);
  
  // Applica la classe di scope quando il componente viene montato
  useEffect(() => {
    document.body.classList.add('login-page-scope');
    
    // Rimuovi la classe quando il componente viene smontato
    return () => {
      document.body.classList.remove('login-page-scope');
    };
  }, []);
  
  // Funzione per mostrare notifiche
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    
    // Auto-hide dopo 5 secondi
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };
  
  // Cambio tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setNotification({ show: false, message: '', type: '' });
  };
  
  // Funzione per gestire il login
  const handleLogin = (e) => {
    e.preventDefault();
    
    console.log("Login tentato con:", loginFormData);
    
    const { email, password, remember } = loginFormData;
    
    // Controlla se le credenziali sono quelle di test
    if (email === TEST_CREDENTIALS.email && password === TEST_CREDENTIALS.password) {
      // Messaggio di successo (diverso in base a "Ricordami")
      const successMessage = remember 
        ? 'Accesso effettuato con successo (sessione verrà ricordata)' 
        : 'Accesso effettuato con successo';
      showNotification(successMessage, 'success');
      
      // Se "Ricordami" è selezionato, salva in localStorage per accessi futuri
      if (remember) {
        localStorage.setItem('testUser', JSON.stringify({
          isAuthenticated: true,
          email: email,
          remember: true
        }));
        console.log('Login riuscito con "Ricordami" attivo, le credenziali verranno salvate');
      } else {
        // Per sessioni senza "Ricordami", usa la sessionStorage (dura solo per la sessione corrente)
        sessionStorage.setItem('sessionUser', JSON.stringify({
          isAuthenticated: true,
          email: email
        }));
        // Rimuovi dalla localStorage se era stato salvato in precedenza
        localStorage.removeItem('testUser');
        console.log('Login riuscito senza "Ricordami", le credenziali NON verranno salvate');
      }
      
      // Reindirizza alla dashboard in entrambi i casi
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } else {
      showNotification(`Credenziali non valide. Usa ${TEST_CREDENTIALS.email} / ${TEST_CREDENTIALS.password}`, 'error');
    }
  };
  
  // Funzione per gestire la registrazione
  const handleRegister = (e) => {
    e.preventDefault();
    
    console.log("Registrazione tentata con:", registerFormData);
    
    const { email, password, confirmPassword, termsAccepted } = registerFormData;
    
    if (!termsAccepted) {
      showNotification('Per favore accetta i termini e condizioni per continuare', 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      showNotification('Le password non corrispondono', 'error');
      return;
    }
    
    // Simuliamo una registrazione di successo
    showNotification('Registrazione completata! Ora puoi accedere con le tue credenziali', 'success');
    
    // Passa alla scheda di login dopo un breve ritardo
    setTimeout(() => {
      setActiveTab('login');
      // Precompila l'email nel form di login
      setLoginFormData(prev => ({
        ...prev,
        email: email
      }));
    }, 2000);
  };
  
  // Funzione per accesso con Google
  const handleGoogleSignIn = () => {
    showNotification('Simulazione accesso con Google...', 'success');
    
    // Simula il login con Google - per default lo consideriamo "remember" true
    setTimeout(() => {
      localStorage.setItem('testUser', JSON.stringify({
        isAuthenticated: true,
        email: 'google-user@example.com',
        provider: 'google',
        remember: true // Per gli accessi social, assumiamo che l'utente voglia essere ricordato
      }));
      
      window.location.href = '/';
    }, 1500);
  };
  
  // Funzione per recupero password
  const handleForgotPassword = (e) => {
    e.preventDefault();
    alert(`Per accedere usa:\nEmail: ${TEST_CREDENTIALS.email}\nPassword: ${TEST_CREDENTIALS.password}`);
  };
  
  return (
    <div className={`auth-page ${isDarkTheme ? 'dark-theme' : ''}`}>
      {/* Decorative elements */}
      <div className="decoration decoration-1"></div>
      <div className="decoration decoration-2"></div>
      <div className="legal-pattern"></div>
      
      <div className="auth-layout">
        {/* Logo */}
        <div className="logo-container">
          <div className="logo">
            <span className="logo-embellishment top-right"></span>
            <div className="logo-main">VALIS</div>
            <span className="logo-embellishment bottom-left"></span>
          </div>
          <div className="logo-tagline">by Lexygraph AI</div>
        </div>
        
        {/* Main Authentication Container */}
        <div className="auth-container">
          <div className="tabs">
            <div 
              className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`} 
              onClick={() => handleTabChange('login')}
            >
              Accesso
            </div>
            <div 
              className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`} 
              onClick={() => handleTabChange('register')}
            >
              Registrazione
            </div>
            <div 
              className="tab-indicator" 
              style={{ transform: `translateX(${activeTab === 'login' ? '0%' : '100%'})` }}
            ></div>
          </div>
          
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
              <span>{notification.message}</span>
            </div>
          )}
          
          {/* Login Form */}
          <div className={`tab-content ${activeTab === 'login' ? 'active' : ''}`} id="login-content">
            <form id="login-form" onSubmit={handleLogin}>
              <div className="form-group">
                <div className="input-container">
                  <input 
                    type="email" 
                    className="form-control" 
                    id="login-email" 
                    placeholder=" " 
                    required
                    value={loginFormData.email}
                    onChange={e => setLoginFormData({...loginFormData, email: e.target.value})}
                  />
                  <label className="form-label" htmlFor="login-email">Indirizzo Email</label>
                </div>
              </div>
              
              <div className="form-group">
                <div className="input-container">
                  <input 
                    type="password" 
                    className="form-control" 
                    id="login-password" 
                    placeholder=" " 
                    required
                    value={loginFormData.password}
                    onChange={e => setLoginFormData({...loginFormData, password: e.target.value})}
                  />
                  <label className="form-label" htmlFor="login-password">Password</label>
                  <i 
                    className="fas fa-eye password-toggle"
                    onClick={() => {
                      const input = document.getElementById('login-password');
                      const icon = document.querySelector('#login-form .password-toggle');
                      if (input.type === 'password') {
                        input.type = 'text';
                        icon.classList.remove('fa-eye');
                        icon.classList.add('fa-eye-slash');
                      } else {
                        input.type = 'password';
                        icon.classList.remove('fa-eye-slash');
                        icon.classList.add('fa-eye');
                      }
                    }}
                  ></i>
                </div>
              </div>
              
              <div className="remember-forgot">
                <label className="remember-me">
                  <input 
                    type="checkbox" 
                    className="remember-checkbox" 
                    id="remember"
                    checked={loginFormData.remember}
                    onChange={e => setLoginFormData({...loginFormData, remember: e.target.checked})}
                  />
                  <div className="custom-checkbox">
                    <i className="fas fa-check"></i>
                  </div>
                  <span className="remember-text">Ricordami</span>
                </label>
                
                <a 
                  href="#" 
                  className="forgot-link" 
                  onClick={handleForgotPassword}
                >
                  Password dimenticata?
                </a>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                Accedi
              </button>
              
              <button 
                type="button" 
                className="btn btn-social" 
                onClick={handleGoogleSignIn}
              >
                <i className="fab fa-google"></i>
                Accedi con Google
              </button>
            </form>
          </div>
          
          {/* Register Form */}
          <div className={`tab-content ${activeTab === 'register' ? 'active' : ''}`} id="register-content">
            <form id="register-form" onSubmit={handleRegister}>
              <div className="form-group">
                <div className="input-container">
                  <input 
                    type="email" 
                    className="form-control" 
                    id="register-email" 
                    placeholder=" " 
                    required
                    value={registerFormData.email}
                    onChange={e => setRegisterFormData({...registerFormData, email: e.target.value})}
                  />
                  <label className="form-label" htmlFor="register-email">Indirizzo Email</label>
                </div>
              </div>
              
              <div className="form-group">
                <div className="input-container">
                  <input 
                    type="password" 
                    className="form-control" 
                    id="register-password" 
                    placeholder=" " 
                    required
                    value={registerFormData.password}
                    onChange={e => {
                      setRegisterFormData({...registerFormData, password: e.target.value});
                    }}
                  />
                  <label className="form-label" htmlFor="register-password">Password</label>
                  <i 
                    className="fas fa-eye password-toggle"
                    onClick={() => {
                      const input = document.getElementById('register-password');
                      const icon = document.querySelector('#register-form .password-toggle');
                      if (input.type === 'password') {
                        input.type = 'text';
                        icon.classList.remove('fa-eye');
                        icon.classList.add('fa-eye-slash');
                      } else {
                        input.type = 'password';
                        icon.classList.remove('fa-eye-slash');
                        icon.classList.add('fa-eye');
                      }
                    }}
                  ></i>
                </div>
                <div className="password-strength" style={{ display: registerFormData.password ? 'block' : 'none' }}>
                  <div 
                    className="password-strength-meter" 
                    style={{ 
                      width: `${registerFormData.password.length > 8 ? 100 : registerFormData.password.length * 12.5}%`,
                      backgroundColor: registerFormData.password.length <= 4 ? '#e53e3e' : 
                                        registerFormData.password.length <= 8 ? '#ed8936' : '#38a169'
                    }}
                  ></div>
                </div>
                <div className="form-help">Usa almeno 8 caratteri con lettere, numeri e simboli</div>
              </div>
              
              <div className="form-group">
                <div className="input-container">
                  <input 
                    type="password" 
                    className="form-control" 
                    id="confirm-password" 
                    placeholder=" " 
                    required
                    value={registerFormData.confirmPassword}
                    onChange={e => setRegisterFormData({...registerFormData, confirmPassword: e.target.value})}
                  />
                  <label className="form-label" htmlFor="confirm-password">Conferma Password</label>
                  <i 
                    className="fas fa-eye password-toggle"
                    onClick={() => {
                      const input = document.getElementById('confirm-password');
                      const icon = input.nextElementSibling.nextElementSibling;
                      if (input.type === 'password') {
                        input.type = 'text';
                        icon.classList.remove('fa-eye');
                        icon.classList.add('fa-eye-slash');
                      } else {
                        input.type = 'password';
                        icon.classList.remove('fa-eye-slash');
                        icon.classList.add('fa-eye');
                      }
                    }}
                  ></i>
                </div>
              </div>
              
              <label className="terms-checkbox">
                <input 
                  type="checkbox" 
                  id="terms-accept" 
                  required
                  checked={registerFormData.termsAccepted}
                  onChange={e => setRegisterFormData({...registerFormData, termsAccepted: e.target.checked})}
                />
                <div className="terms-custom-checkbox">
                  <i className="fas fa-check"></i>
                </div>
                <span className="terms-text">
                  Accetto i <a href="#" target="_blank">Termini di Servizio</a> e la <a href="#" target="_blank">Privacy Policy</a> 
                </span>
              </label>
              
              <button type="submit" className="btn btn-primary">
                Registrati
              </button>
              
              <button 
                type="button" 
                className="btn btn-social" 
                onClick={handleGoogleSignIn}
              >
                <i className="fab fa-google"></i>
                Registrati con Google
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;