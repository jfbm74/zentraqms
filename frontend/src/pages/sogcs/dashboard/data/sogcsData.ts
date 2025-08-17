// Datos para métricas SOGCS (Sistema Obligatorio de Garantía de Calidad en Salud)

export const sogcsMetrics = [
    {
        id: 1,
        label: "Sedes Habilitadas",
        badge: "ri-arrow-up-circle-line text-success",
        icon: "ri-hospital-line",
        counter: 24,
        decimals: 0,
        suffix: "",
        prefix: "",
        separator: ""
    },
    {
        id: 2,
        label: "Cumplimiento SOGCS",
        badge: "ri-arrow-up-circle-line text-success",
        icon: "ri-shield-check-line",
        counter: 87.5,
        decimals: 1,
        suffix: "%",
        prefix: "",
        separator: ""
    },
    {
        id: 3,
        label: "Alertas Críticas",
        badge: "ri-arrow-down-circle-line text-danger",
        icon: "ri-error-warning-line",
        counter: 3,
        decimals: 0,
        suffix: "",
        prefix: "",
        separator: ""
    },
    {
        id: 4,
        label: "Servicios Activos",
        badge: "ri-arrow-up-circle-line text-success",
        icon: "ri-service-line",
        counter: 156,
        decimals: 0,
        prefix: "",
        suffix: "",
        separator: ","
    },
    {
        id: 5,
        label: "Próximas Auditorías",
        badge: "ri-arrow-right-circle-line text-warning",
        icon: "ri-calendar-check-line",
        counter: 7,
        decimals: 0,
        suffix: "",
        prefix: "",
        separator: ""
    }
];

export const componentesSOGCS = [
    {
        id: 1,
        componente: "SUH",
        nombre: "Sistema Único de Habilitación",
        estado: "activo",
        cumplimiento: 92.5,
        color: "#405189",
        icono: "ri-shield-check-line"
    },
    {
        id: 2,
        componente: "PAMEC",
        nombre: "Programa de Auditoría para el Mejoramiento de la Calidad",
        estado: "en_progreso",
        cumplimiento: 78.3,
        color: "#0ab39c",
        icono: "ri-file-search-line"
    },
    {
        id: 3,
        componente: "SIC",
        nombre: "Sistema de Información para la Calidad",
        estado: "activo",
        cumplimiento: 95.1,
        color: "#f7b84b",
        icono: "ri-bar-chart-line"
    },
    {
        id: 4,
        componente: "SUA",
        nombre: "Sistema Único de Acreditación",
        estado: "pendiente",
        cumplimiento: 45.7,
        color: "#f06548",
        icono: "ri-award-line"
    }
];

export const estadosHabilitacion = [
    {
        id: 1,
        estado: "Habilitada",
        cantidad: 18,
        porcentaje: 75,
        color: "#0ab39c",
        icono: "ri-checkbox-circle-line"
    },
    {
        id: 2,
        estado: "En Renovación",
        cantidad: 4,
        porcentaje: 17,
        color: "#f7b84b",
        icono: "ri-time-line"
    },
    {
        id: 3,
        estado: "Suspendida",
        cantidad: 1,
        porcentaje: 4,
        color: "#f06548",
        icono: "ri-pause-circle-line"
    },
    {
        id: 4,
        estado: "Vencida",
        cantidad: 1,
        porcentaje: 4,
        color: "#f06548",
        icono: "ri-close-circle-line"
    }
];

export const tareasCalidad = [
    {
        id: 1,
        titulo: "Actualizar protocolo de bioseguridad",
        prioridad: "alta",
        fechaVencimiento: "2024-09-15",
        responsable: "Dr. María González",
        estado: "pendiente",
        categoria: "SUH"
    },
    {
        id: 2,
        titulo: "Auditoría interna servicios ambulatorios",
        prioridad: "media",
        fechaVencimiento: "2024-09-20",
        responsable: "Lic. Carlos Rodríguez",
        estado: "en_progreso",
        categoria: "PAMEC"
    },
    {
        id: 3,
        titulo: "Reporte mensual indicadores SIC",
        prioridad: "alta",
        fechaVencimiento: "2024-09-10",
        responsable: "Ing. Ana López",
        estado: "completado",
        categoria: "SIC"
    },
    {
        id: 4,
        titulo: "Preparación documentos SUA",
        prioridad: "baja",
        fechaVencimiento: "2024-10-01",
        responsable: "Dr. Jorge Martínez",
        estado: "pendiente",
        categoria: "SUA"
    },
    {
        id: 5,
        titulo: "Verificación equipos biomédicos",
        prioridad: "alta",
        fechaVencimiento: "2024-09-12",
        responsable: "Tec. Luis Herrera",
        estado: "en_progreso",
        categoria: "SUH"
    }
];

export const proximasActividades = [
    {
        id: 1,
        titulo: "Auditoría Externa MinSalud",
        fecha: "2024-09-25",
        hora: "08:00",
        tipo: "auditoria",
        ubicacion: "Sede Principal",
        responsable: "Coordinación de Calidad"
    },
    {
        id: 2,
        titulo: "Capacitación PAMEC",
        fecha: "2024-09-18",
        hora: "14:00",
        tipo: "capacitacion",
        ubicacion: "Aula Virtual",
        responsable: "Dr. Patricia Silva"
    },
    {
        id: 3,
        titulo: "Revisión SUH Urgencias",
        fecha: "2024-09-20",
        hora: "10:00",
        tipo: "revision",
        ubicacion: "Servicio de Urgencias",
        responsable: "Comité de Calidad"
    },
    {
        id: 4,
        titulo: "Entrega Reporte SIC",
        fecha: "2024-09-30",
        hora: "16:00",
        tipo: "entrega",
        ubicacion: "Gerencia",
        responsable: "Oficina de Calidad"
    }
];

export const tendenciasCumplimientoData = {
    series: [
        {
            name: "SUH",
            data: [85, 87, 89, 91, 92.5, 94, 93, 95, 94.5, 96, 95.5, 97]
        },
        {
            name: "PAMEC", 
            data: [70, 72, 75, 76, 78, 78.3, 80, 81, 79, 82, 81.5, 83]
        },
        {
            name: "SIC",
            data: [88, 90, 92, 93, 94, 95.1, 96, 97, 95, 98, 97.5, 99]
        },
        {
            name: "SUA",
            data: [30, 32, 35, 38, 40, 42, 45.7, 48, 50, 47, 49, 52]
        }
    ],
    categories: [
        "Ene", "Feb", "Mar", "Abr", "May", "Jun",
        "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    ]
};