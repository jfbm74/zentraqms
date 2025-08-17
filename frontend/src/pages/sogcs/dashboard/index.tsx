import React from 'react';
import { useSOGCSConfig } from '../../../hooks/useModuleConfig';
import LayoutWithBreadcrumb from '../../../components/layout/LayoutWithBreadcrumb';
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
    
    // Usar el hook específico para SOGCS
    const moduleConfig = useSOGCSConfig('dashboard');
    
    return (
        <LayoutWithBreadcrumb moduleConfig={moduleConfig}>
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
        </LayoutWithBreadcrumb>
    );
};

export default DashboardSOGCS;