
export const OFFER_STATUS_FLOW: Record<string, string[]> = {
    'Borrador': ['Pendiente de validar'],
    'Pendiente de validar': ['Validada', 'Rechazada', 'Borrador'],
    'Validada': ['Enviada', 'Pendiente de validar', 'Borrador'],
    'Enviada': ['Adjudicada', 'Rechazada', 'Validada'],
    'Adjudicada': ['Enviada'], // Allow reopening if mistake
    'Rechazada': ['Borrador']  // Allow restarting
};

export function getNextPossibleStatuses(currentStatus: string, isAdmin: boolean = false): string[] {
    const allStatuses = ['Borrador', 'Pendiente de validar', 'Validada', 'Enviada', 'Adjudicada', 'Rechazada'];

    if (isAdmin) return allStatuses;

    // specific flow
    const allowed = OFFER_STATUS_FLOW[currentStatus];
    if (!allowed) {
        // Fallback: if status unknown, allow going back to Draft
        return ['Borrador'];
    }

    return allowed;
}
