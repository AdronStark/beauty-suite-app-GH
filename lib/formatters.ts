// Using 'es-ES' for Spanish number formatting (dots for thousands, commas for decimals)
export const formatCurrency = (amount: number, decimals: number = 3): string => {
    return (amount || 0).toLocaleString('es-ES', {
        minimumFractionDigits: 0, // Allow fewer decimals if clean number
        maximumFractionDigits: decimals
    });
};

export const formatNumber = (amount: number, decimals: number = 3): string => {
    return (amount || 0).toLocaleString('es-ES', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals
    });
};

export const formatOptionalDecimals = (amount: number, maxDecimals: number = 2): string => {
    return (amount || 0).toLocaleString('de-DE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: maxDecimals
    });
};
