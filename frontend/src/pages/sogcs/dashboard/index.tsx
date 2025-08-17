import React from 'react';
import BreadCrumb from '../../../components/common/BreadCrumb';
import SubHeader from '../../../components/navigation/SubHeader';
import CumplimientoOverview from './CumplimientoOverview';
import ProximasAuditorias from './ProximasAuditorias';
import EstadosHabilitacion from './EstadosHabilitacion';
import ComponentesSOGCS from './ComponentesSOGCS';
import TareasCalidad from './TareasCalidad';
import TendenciasCumplimiento from './TendenciasCumplimiento';
import ProximasActividades from './ProximasActividades';
import MetricasSOGCS from './MetricasSOGCS';


const DashboardSOGCS = () => {
    document.title="SOGCS - Sistema Obligatorio de Garantía de Calidad en Salud | ZentraQMS";
    return (
        <React.Fragment>
            <div className="page-content sogcs-page-content">
                <div className="container-fluid">  
                    <BreadCrumb title="SOGCS" pageTitle="Sistema de Gestión de Calidad" />
                    
                    {/* Subheader de navegación */}
                    <SubHeader
                        activeTab="dashboard"
                    />
                    
                    {/* Métricas principales */}
                    <div className="row">
                        <MetricasSOGCS />
                    </div>
                    
                    {/* Gráficos de tendencias y componentes */}
                    <div className="row">
                        <TendenciasCumplimiento />
                        <ComponentesSOGCS />
                        <CumplimientoOverview />
                    </div>
                    
                    {/* Estados y tareas */}
                    <div className="row">
                        <EstadosHabilitacion />
                        <TareasCalidad />
                    </div>
                    
                    {/* Actividades y auditorías */}
                    <div className="row">
                        <ProximasActividades />
                        <ProximasAuditorias />
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};

export default DashboardSOGCS;