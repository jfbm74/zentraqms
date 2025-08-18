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
            <div className="row mt-4">
                <MetricasSOGCS />
            </div>
            
            {/* Gráficos de tendencias y componentes */}
            <div className="row">
                {/* Columna izquierda: Tendencias y Resumen */}
                <div className="col-xxl-6 col-md-6">
                    <div className="row">
                        <div className="col-12">
                            <TendenciasCumplimiento />
                        </div>
                        <div className="col-12 mt-3">
                            <CumplimientoOverview />
                        </div>
                    </div>
                </div>
                {/* Columna derecha: Componentes SOGCS */}
                <ComponentesSOGCS />
            </div>
            
            {/* Estados y tareas */}
            <div className="row">
                <EstadosHabilitacion />
                <TareasCalidad />
            </div>
            
            {/* Actividades y auditorías */}
            <div className="row mt-4">
                <ProximasActividades />
                <ProximasAuditorias />
            </div>
        </LayoutWithBreadcrumb>
    );
};

export default DashboardSOGCS;