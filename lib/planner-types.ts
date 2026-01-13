export interface ProductionBlock {
    id: string;
    articleCode: string;
    articleDesc: string;
    units: number;
    unitsOrdered?: number | null;
    unitsServed?: number | null;
    unitsPending?: number | null;
    clientName?: string;
    orderNumber?: string | null;
    deadline?: Date | string | null;
    orderDate?: Date | string | null;

    // Planning Data
    status: 'PENDING' | 'PLANNED' | 'PRODUCED' | 'CANCELLED' | string; // Relaxed string for API
    plannedDate?: Date | string | null;
    plannedReactor?: string | null;
    plannedShift?: 'Mañana' | 'Tarde' | string | null;
    batchLabel?: string | null;

    // Execution Data
    realKg?: number | null;
    realDuration?: number | null;
    operatorNotes?: string | null;

    // Relations
    relatedBlocks?: ProductionBlock[]; // Self-relation for splits
    parentId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    erpId?: string | null;
}

export interface Holiday {
    id: string;
    date: Date | string;
    description?: string | null; // Match Prisma
    name?: string; // Keep for compatibility if needed
    type?: 'NATIONAL' | 'LOCAL' | string;
}

export interface MaintenanceBlock {
    id: string;
    reactorId: string;
    startDate: Date | string;
    endDate: Date | string;
    reason: string;
}

export interface AutoPlanResult {
    success: boolean;
    planned: number;
    splits: number;
    results: ProductionBlock[];
    errors?: string[];
}
