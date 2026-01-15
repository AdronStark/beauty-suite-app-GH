
import {
    Calendar, FileText, BarChart2, Tag,
    Microscope, Users, FlaskConical, LayoutGrid
} from 'lucide-react';

export interface AppDefinition {
    id: string;
    title: string;
    description?: string;
    path: string;
    iconName: string;
    allowedRoles: 'all' | string[]; // 'all' or ['ADMIN', 'MANAGER', etc]
    allowedCompanies: 'all' | string[]; // 'all' or ['coper', 'jumsa']
    group: 'direction' | 'rd' | 'commercial' | 'production';
    status: 'active' | 'coming_soon';
}

export const DEFAULT_APP_CONFIG: AppDefinition[] = [
    // --- DIRECCIÓN ---
    {
        id: 'dashboard',
        title: 'Cuadro de Mando',
        description: 'KPIs estratégicos, estadísticas de negocio y visión global del suite.',
        path: '/direccion',
        iconName: 'BarChart2',
        allowedRoles: ['ADMIN', 'MANAGER'],
        allowedCompanies: 'all',
        group: 'direction',
        status: 'active'
    },

    // --- I+D ---
    {
        id: 'workload',
        title: 'Carga de Trabajo',
        description: 'Gestión de tareas y asignación de recursos I+D.',
        path: '/workload',
        iconName: 'Clock',
        allowedRoles: 'all',
        allowedCompanies: 'all',
        group: 'rd',
        status: 'active'
    },
    {
        id: 'briefings',
        title: 'Briefings',
        description: 'Creación y Gestión de briefings de productos.',
        path: '/briefings',
        iconName: 'FileText',
        allowedRoles: 'all',
        allowedCompanies: 'all',
        group: 'rd',
        status: 'active'
    },
    {
        id: 'formulas',
        title: 'Biblioteca Fórmulas',
        description: 'Repositorio global de fórmulas y versiones.',
        path: '/formulas',
        iconName: 'FlaskConical',
        allowedRoles: 'all',
        allowedCompanies: 'all',
        group: 'rd',
        status: 'active'
    },
    {
        id: 'new-developments',
        title: 'Nuevos Desarrollos',
        description: 'Seguimiento de proyectos de formulación.',
        path: '/developments',
        iconName: 'Microscope',
        allowedRoles: 'all',
        allowedCompanies: 'all',
        group: 'rd',
        status: 'coming_soon'
    },

    // --- COMERCIAL ---
    {
        id: 'offers',
        title: 'Configurador de Ofertas',
        description: 'Generador y analista de ofertas comerciales.',
        path: '/ofertas',
        iconName: 'Tag',
        allowedRoles: 'all',
        allowedCompanies: ['coper', 'jumsa', 'cosmeprint'], // Excludes Ternum
        group: 'commercial',
        status: 'active'
    },
    {
        id: 'projects',
        title: 'Seguimiento Proyectos',
        description: 'Estado y funnel de ofertas ganadas.',
        path: '/projects',
        iconName: 'BarChart2',
        allowedRoles: 'all',
        allowedCompanies: 'all',
        group: 'commercial',
        status: 'coming_soon'
    },
    {
        id: 'crm',
        title: 'CRM',
        description: 'Dashboard comercial, funnel de ventas y KPIs de negocio.',
        path: '/crm',
        iconName: 'BarChart2',
        allowedRoles: 'all',
        allowedCompanies: 'all',
        group: 'commercial',
        status: 'active'
    },

    // --- PRODUCCIÓN ---
    {
        id: 'planner-coper',
        title: 'Planificador Coper',
        description: 'Gestión y calendario de producción Coper.',
        path: '/planificador',
        iconName: 'Calendar',
        allowedRoles: 'all',
        allowedCompanies: ['coper'],
        group: 'production',
        status: 'active'
    },
    {
        id: 'planner-jumsa',
        title: 'Planificador Jumsa',
        description: 'Gestión y calendario de producción Jumsa.',
        path: '/planificador-jumsa', // Placeholder path
        iconName: 'Calendar',
        allowedRoles: 'all',
        allowedCompanies: ['jumsa'],
        group: 'production',
        status: 'coming_soon'
    },
    {
        id: 'stock',
        title: 'Gestión Materias Primas',
        description: 'Seguimiento de pedidos de compra y recepción.',
        path: '/materias-primas',
        iconName: 'Package',
        allowedRoles: 'all',
        allowedCompanies: ['coper'],
        group: 'production',
        status: 'active'
    },
    {
        id: 'sheets',
        title: 'Hojas de Fabricación',
        description: 'Hojas de producción digitales y control de lotes.',
        path: '/sheets',
        iconName: 'FileText',
        allowedRoles: 'all',
        allowedCompanies: ['coper', 'jumsa'],
        group: 'production',
        status: 'coming_soon'
    }
];

export function isAppAccessible(appId: string, userRole?: string, companyId?: string | null): boolean {
    const app = DEFAULT_APP_CONFIG.find(a => a.id === appId || a.path === appId); // Allow finding by ID or Path
    if (!app) return false;

    // Check Role
    if (app.allowedRoles !== 'all') {
        if (!userRole || !app.allowedRoles.includes(userRole)) return false;
    }

    // Check Company
    if (app.allowedCompanies !== 'all') {
        // If app requires specific companies, user MUST belong to one of them
        // If no company selected, deny access (strict mode)
        if (!companyId) return false;
        if (!app.allowedCompanies.includes(companyId)) return false;
    }

    return true;
}

export function getAppsByGroup(group: AppDefinition['group']) {
    return DEFAULT_APP_CONFIG.filter(a => a.group === group);
}

