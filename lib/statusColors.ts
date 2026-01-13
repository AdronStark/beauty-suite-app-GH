export const getStatusColor = (s: string) => {
    switch (s) {
        // Offers statuses
        case 'Adjudicada': return '#16a34a'; // Green
        case 'Rechazada': return '#dc2626'; // Red
        case 'Enviada': return '#2563eb'; // Blue
        case 'Validada': return '#9333ea'; // Purple
        case 'Pendiente de validar': return '#d97706'; // Orange
        // Briefing statuses
        case 'Borrador': return '#64748b'; // Gray
        case 'Draft': return '#64748b'; // Gray (legacy)
        case 'Enviado a Cliente': return '#2563eb'; // Blue
        case 'Aceptado': return '#16a34a'; // Green
        case 'Rechazado': return '#dc2626'; // Red
        default: return '#64748b'; // Gray fallback
    }
};
