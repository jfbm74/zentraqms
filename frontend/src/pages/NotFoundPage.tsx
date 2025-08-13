/**
 * 404 Not Found Page for ZentraQMS Frontend
 * 
 * Error page for when users navigate to non-existent routes.
 */

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Página No Encontrada | ZentraQMS';
  }, []);

  return (
    <div className="auth-page-wrapper pt-5">
      <div className="auth-one-bg-position auth-one-bg">
        <div className="bg-overlay"></div>
        
        <div className="shape">
          <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 1440 120">
            <path d="M 0,36 C 144,53.6 432,123.2 720,124 C 1008,124.8 1296,56.8 1440,40L1440 140L0 140z"></path>
          </svg>
        </div>

        <div className="auth-page-content mt-lg-5">
          <div className="container">
            <div className="row">
              <div className="col-lg-12">
                <div className="text-center mt-sm-5 mb-4 text-white-50">
                  <div>
                    <Link to="/" className="d-inline-block auth-logo">
                      <img src="/src/assets/images/logo-light.png" alt="ZentraQMS" height="20" />
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
                  <div className="card-body p-4 text-center">
                    <div className="avatar-lg mx-auto">
                      <div className="avatar-title bg-primary text-primary bg-opacity-10 rounded-circle fs-2">
                        <i className="ri-search-line"></i>
                      </div>
                    </div>
                    <div className="mt-5">
                      <h1 className="ff-secondary fw-semibold text-primary lh-base">404</h1>
                      <h4 className="text-uppercase">Página No Encontrada</h4>
                      <p className="text-muted mb-4">
                        Lo sentimos, la página que está buscando no existe o ha sido movida.
                      </p>
                      <Link to="/dashboard" className="btn btn-success">
                        <i className="mdi mdi-home me-1"></i>
                        Volver al Dashboard
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="mb-0 text-white-50">
                    ¿Necesita ayuda?{' '}
                    <Link to="/support" className="text-white text-decoration-underline">
                      Contactar Soporte
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="text-center">
                <p className="mb-0 text-muted">
                  &copy; {new Date().getFullYear()} ZentraQMS. 
                  Desarrollado con{' '}
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

export default NotFoundPage;