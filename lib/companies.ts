export interface Company {
    id: string;
    name: string;
    fullName: string;
    color: string;
    description: string;
    type: 'production' | 'lab' | 'distribution';
    logoPath: string;
}

export const COMPANIES: Company[] = [
    {
        id: 'coper',
        name: 'Coper',
        fullName: 'Laboratorios Coper, S.L.',
        color: '#3b82f6',
        description: 'Fabricación de producto cosmético y mezclas (bulk).',
        type: 'production',
        logoPath: '/images/logos/logo_coper.jpg'
    },
    {
        id: 'jumsa',
        name: 'Jumsa',
        fullName: 'Envasados Jumsa, S.A.',
        color: '#f59e0b',
        description: 'Envasado, llenado y packaging de productos cosméticos.',
        type: 'production',
        logoPath: '/images/logos/logo-jumsa.jpg'
    },
    {
        id: 'ternum',
        name: 'Ternum',
        fullName: 'Ternum Lab, S.L.',
        color: '#8b5cf6',
        description: 'Laboratorio de I+D y formulación avanzada.',
        type: 'lab',
        logoPath: '/images/logos/logo-ternum.png'
    },
    {
        id: 'cosmeprint',
        name: 'Cosmeprint',
        fullName: 'Cosmeprint Distribution',
        color: '#ec4899',
        description: 'Distribución de envases y packaging cosmético.',
        type: 'distribution',
        logoPath: '/images/logos/logo-cosmeprint.jpg'
    }
];

export const getCompanyById = (id: string) => COMPANIES.find(c => c.id === id);
