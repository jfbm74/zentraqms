/**
 * Login Page for ZentraQMS Frontend
 * 
 * Adapted from Velzon template with ZentraQMS authentication integration.
 * Uses React Hook Form for form validation and our custom auth system.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import { LoginFormData } from '../../types/auth.types';
import logoLight from '../../assets/images/logo-light.png';
import authBg from '../../assets/images/auth-one-bg.jpg';

/**
 * Type for React Router location state
 */
interface LocationState {
  from?: {
    pathname: string;
  };
}

/**
 * Login form validation schema
 */
const loginValidationRules = {
  email: {
    required: 'El correo electrónico es requerido',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Ingrese un correo electrónico válido'
    }
  },
  password: {
    required: 'La contraseña es requerida',
    minLength: {
      value: 6,
      message: 'La contraseña debe tener al menos 6 caracteres'
    }
  }
};

/**
 * Login Page Component
 */
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();

  // State for password visibility
  const [showPassword, setShowPassword] = useState(false);
  
  // Form management with React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch
  } = useForm<LoginFormData>({
    defaultValues: {
      email: import.meta.env.DEV ? 'admin@zentraqms.com' : '',
      password: import.meta.env.DEV ? '123456' : '',
      remember: false
    }
  });

  // Get redirect URL from location state
  const from = (location.state as LocationState)?.from?.pathname || '/dashboard';

  /**
   * Handle form submission
   */
  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      
      await login({
        email: data.email,
        password: data.password
      });

      // Success message
      toast.success('¡Bienvenido! Has iniciado sesión correctamente.');
    } catch (error: any) {
      console.error('[LoginPage] Login failed:', error);
      
      // Show specific error messages
      if (error.response?.status === 401) {
        toast.error('Credenciales inválidas. Verifica tu email y contraseña.');
      } else if (error.response?.status === 403) {
        toast.error('Tu cuenta está desactivada. Contacta al administrador.');
      } else if (!error.response) {
        toast.error('Error de conexión. Verifica tu conexión a internet.');
      } else {
        toast.error('Error al iniciar sesión. Intenta nuevamente.');
      }
    }
  };

  /**
   * Handle demo login
   */
  const handleDemoLogin = async () => {
    setValue('email', 'admin@zentraqms.com');
    setValue('password', '123456');
    
    // Clear any existing errors
    clearError();
    
    // Trigger form submission
    handleSubmit(onSubmit)();
  };

  /**
   * Redirect if already authenticated
   */
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  /**
   * Clear error when component unmounts or email changes
   */
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  useEffect(() => {
    const subscription = watch(() => {
      if (error) clearError();
    });
    return () => subscription.unsubscribe();
  }, [watch, error, clearError]);

  /**
   * Set page title
   */
  useEffect(() => {
    document.title = 'Iniciar Sesión | ZentraQMS - Sistema de Gestión de Calidad';
  }, []);

  return (
    <div className="auth-page-wrapper pt-5">
      {/* Background with overlay */}
      <div 
        className="auth-one-bg-position auth-one-bg" 
        style={{ backgroundImage: `url(${authBg})` }}
      >
        <div className="bg-overlay"></div>
        
        {/* Decorative shape */}
        <div className="shape">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            version="1.1" 
            xmlnsXlink="http://www.w3.org/1999/xlink" 
            viewBox="0 0 1440 120"
          >
            <path d="M 0,36 C 144,53.6 432,123.2 720,124 C 1008,124.8 1296,56.8 1440,40L1440 140L0 140z"></path>
          </svg>
        </div>

        {/* Auth content */}
        <div className="auth-page-content mt-lg-5">
          <div className="container">
            <div className="row">
              <div className="col-lg-12">
                <div className="text-center mt-sm-5 mb-4 text-white-50">
                  <div>
                    <Link to="/" className="d-inline-block auth-logo">
                      <img src={logoLight} alt="ZentraQMS" height="20" />
                    </Link>
                  </div>
                  <p className="mt-3 fs-15 fw-medium">
                    Sistema de Gestión de Calidad
                  </p>
                </div>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-md-8 col-lg-6 col-xl-5">
                <div className="card mt-4 card-bg-fill">
                  <div className="card-body p-4">
                    <div className="text-center mt-2">
                      <h5 className="text-primary">¡Bienvenido de Vuelta!</h5>
                      <p className="text-muted">
                        Inicia sesión para continuar en ZentraQMS
                      </p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                      <div className="alert alert-danger" role="alert">
                        <div className="d-flex align-items-center">
                          <i className="ri-error-warning-line me-2"></i>
                          {error}
                        </div>
                      </div>
                    )}

                    {/* Login Form */}
                    <div className="p-2 mt-4">
                      <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        {/* Email Field */}
                        <div className="mb-3">
                          <label htmlFor="email" className="form-label">
                            Correo Electrónico
                          </label>
                          <input
                            {...register('email', loginValidationRules.email)}
                            type="email"
                            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                            id="email"
                            placeholder="Ingrese su correo electrónico"
                            autoComplete="email"
                            autoFocus
                          />
                          {errors.email && (
                            <div className="invalid-feedback">
                              {errors.email.message}
                            </div>
                          )}
                        </div>

                        {/* Password Field */}
                        <div className="mb-3">
                          <div className="float-end">
                            <Link 
                              to="/auth/forgot-password" 
                              className="text-muted text-decoration-underline"
                            >
                              ¿Olvidó su contraseña?
                            </Link>
                          </div>
                          <label htmlFor="password" className="form-label">
                            Contraseña
                          </label>
                          <div className="position-relative auth-pass-inputgroup mb-3">
                            <input
                              {...register('password', loginValidationRules.password)}
                              type={showPassword ? 'text' : 'password'}
                              className={`form-control pe-5 ${errors.password ? 'is-invalid' : ''}`}
                              id="password"
                              placeholder="Ingrese su contraseña"
                              autoComplete="current-password"
                            />
                            <button
                              className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted"
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              style={{ zIndex: 10 }}
                            >
                              <i className={`ri-eye-${showPassword ? 'off' : 'fill'} align-middle`}></i>
                            </button>
                            {errors.password && (
                              <div className="invalid-feedback">
                                {errors.password.message}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Remember Me */}
                        <div className="form-check">
                          <input
                            {...register('remember')}
                            className="form-check-input"
                            type="checkbox"
                            id="auth-remember-check"
                          />
                          <label className="form-check-label" htmlFor="auth-remember-check">
                            Recordarme
                          </label>
                        </div>

                        {/* Submit Button */}
                        <div className="mt-4">
                          <button
                            type="submit"
                            className="btn btn-success w-100"
                            disabled={isSubmitting || isLoading}
                          >
                            {(isSubmitting || isLoading) && (
                              <div className="spinner-border spinner-border-sm me-2" role="status">
                                <span className="visually-hidden">Cargando...</span>
                              </div>
                            )}
                            Iniciar Sesión
                          </button>
                        </div>

                        {/* Demo Login Button */}
                        <div className="mt-3">
                          <button
                            type="button"
                            className="btn btn-outline-primary w-100"
                            onClick={handleDemoLogin}
                            disabled={isSubmitting || isLoading}
                          >
                            <i className="ri-play-circle-line me-1"></i>
                            Acceso de Demostración
                          </button>
                        </div>

                        {/* Social Login Section (Optional - for future use) */}
                        <div className="mt-4 text-center">
                          <div className="signin-other-title">
                            <h5 className="fs-13 mb-4 title text-muted">
                              Próximamente: Inicio con SSO
                            </h5>
                          </div>
                          <div>
                            <button 
                              type="button"
                              className="btn btn-light btn-icon me-2" 
                              disabled
                              title="Próximamente"
                            >
                              <i className="ri-microsoft-fill fs-16"></i>
                            </button>
                            <button 
                              type="button"
                              className="btn btn-light btn-icon me-2" 
                              disabled
                              title="Próximamente"
                            >
                              <i className="ri-google-fill fs-16"></i>
                            </button>
                            <button 
                              type="button"
                              className="btn btn-light btn-icon" 
                              disabled
                              title="Próximamente"
                            >
                              <i className="ri-github-fill fs-16"></i>
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>

                {/* Registration Link */}
                <div className="mt-4 text-center">
                  <p className="mb-0 text-white-50">
                    ¿No tiene una cuenta?{' '}
                    <Link 
                      to="/auth/register" 
                      className="fw-semibold text-primary text-decoration-underline"
                    >
                      Solicitar Acceso
                    </Link>
                  </p>
                </div>

                {/* Help Section */}
                <div className="mt-3 text-center">
                  <p className="mb-0 text-white-50 small">
                    ¿Necesita ayuda?{' '}
                    <Link 
                      to="/support" 
                      className="text-white text-decoration-underline"
                    >
                      Contactar Soporte
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="text-center">
                <p className="mb-0 text-muted">
                  &copy; {new Date().getFullYear()} ZentraQMS. 
                  Desarrollado por Zentratek con{' '}
                  <i className="mdi mdi-heart text-danger"></i>{' '}
                  para la Excelencia en Calidad
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;