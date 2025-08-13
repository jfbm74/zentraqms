/**
 * Profile Page for ZentraQMS Frontend
 * 
 * User profile management page.
 */

import React, { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    document.title = 'Mi Perfil | ZentraQMS';
  }, []);

  return (
    <React.Fragment>
      <div className="row">
        <div className="col-12">
          <div className="page-title-box d-sm-flex align-items-center justify-content-between">
            <h4 className="mb-sm-0">Mi Perfil</h4>
            <div className="page-title-right">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item"><a href="/dashboard">Dashboard</a></li>
                <li className="breadcrumb-item active">Perfil</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Información del Usuario</h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-lg-3">
                  <div className="text-center">
                    <img 
                      src="/src/assets/images/users/avatar-1.jpg" 
                      alt="avatar" 
                      className="avatar-lg rounded-circle mx-auto d-block"
                    />
                    <h5 className="mt-3 mb-1">{user?.first_name} {user?.last_name}</h5>
                    <p className="text-muted">{user?.email}</p>
                  </div>
                </div>
                <div className="col-lg-9">
                  <div className="table-responsive">
                    <table className="table table-borderless mb-0">
                      <tbody>
                        <tr>
                          <th className="ps-0" scope="row">Nombre Completo:</th>
                          <td className="text-muted">{user?.first_name} {user?.last_name}</td>
                        </tr>
                        <tr>
                          <th className="ps-0" scope="row">Correo Electrónico:</th>
                          <td className="text-muted">{user?.email}</td>
                        </tr>
                        <tr>
                          <th className="ps-0" scope="row">Rol:</th>
                          <td className="text-muted">
                            <span className="badge bg-success-subtle text-success">
                              {user?.is_staff ? 'Administrador' : 'Usuario'}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <th className="ps-0" scope="row">Estado:</th>
                          <td className="text-muted">
                            <span className="badge bg-success-subtle text-success">
                              {user?.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <th className="ps-0" scope="row">Último Acceso:</th>
                          <td className="text-muted">{new Date().toLocaleDateString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default ProfilePage;