import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container-fluid">
        <div className="row">
          <div className="col-sm-6">
            <div className="text-sm-start d-none d-sm-block">
              © {currentYear} ZentraQMS - Sistema de Gestión de Calidad
            </div>
          </div>
          <div className="col-sm-6">
            <div className="text-sm-end d-none d-sm-block">
              Desarrollado por Zentratek.com con ❤️ para la Excelencia Organizacional
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;