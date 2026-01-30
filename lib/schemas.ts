import { z } from 'zod';

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

/** Schema for validating an array of IDs (bulk operations) */
export const BulkIdsSchema = z.object({
    ids: z.array(z.string().min(1)).min(1, "At least one ID is required"),
});

/** Schema for date strings in ISO format */
export const ISODateSchema = z.string().datetime().optional();

// ============================================================================
// CRM SCHEMAS
// ============================================================================

export const SalesBudgetSchema = z.object({
    id: z.string().optional(),
    year: z.coerce.number().int().min(2020).max(2100),
    companyId: z.string().min(1, "Company ID is required"),
    client: z.string().min(1, "Client name is required"),
    amount: z.coerce.number().min(0, "Amount must be positive"),
});

export type SalesBudgetInput = z.infer<typeof SalesBudgetSchema>;

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const UserCreateSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 chars").max(100),
    password: z.string().min(6, "Password must be at least 6 chars").max(128),
    name: z.string().min(1, "Display Name is required").max(200),
    firstName: z.string().max(100).optional(),
    lastName1: z.string().max(100).optional(),
    lastName2: z.string().max(100).optional(),
    role: z.enum(['ADMIN', 'USER', 'MANAGER', 'CLIENT']),
    companies: z.array(z.string()).optional(),
    isTechnical: z.boolean().optional(),
    isCommercial: z.boolean().optional(),
    position: z.string().max(100).optional(),
    connectedClientName: z.string().max(200).optional(),
});

export type UserCreateInput = z.infer<typeof UserCreateSchema>;

// ============================================================================
// OFFER SCHEMAS
// ============================================================================

export const OfferCreateSchema = z.object({
    client: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    responsableComercial: z.string().max(200).optional(),
    responsableTecnico: z.string().max(200).optional(),
    fechaEntrega: z.string().optional().nullable(),
    briefingId: z.string().optional().nullable(),
    inputData: z.union([z.string(), z.object({}).passthrough()]).optional(),
    resultsSummary: z.union([z.string(), z.object({}).passthrough()]).optional(),
});

export const OfferUpdateSchema = z.object({
    client: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    status: z.string().max(50).optional(),
    inputData: z.union([z.string(), z.object({}).passthrough()]).optional(),
    resultsSummary: z.union([z.string(), z.object({}).passthrough()]).optional(),
    items: z.array(z.object({
        id: z.string().optional(),
        productName: z.string().max(200).optional(),
        inputData: z.union([z.string(), z.object({}).passthrough()]).optional(),
        resultsSummary: z.union([z.string(), z.object({}).passthrough()]).optional(),
        order: z.number().int().min(0).optional(),
    })).optional(),
});

export const OfferPatchSchema = z.object({
    responsableComercial: z.string().max(200).optional(),
    responsableTecnico: z.string().max(200).optional(),
    probability: z.number().min(0).max(100).optional(),
    status: z.string().max(50).optional(),
    client: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
});

export type OfferCreateInput = z.infer<typeof OfferCreateSchema>;
export type OfferUpdateInput = z.infer<typeof OfferUpdateSchema>;
export type OfferPatchInput = z.infer<typeof OfferPatchSchema>;

// ============================================================================
// BRIEFING SCHEMAS
// ============================================================================

export const BriefingCreateSchema = z.object({
    clientName: z.string().min(1).max(200),
    productName: z.string().min(1).max(200),
    category: z.string().max(100).optional(),
    responsableComercial: z.string().max(200).optional(),
    responsableTecnico: z.string().max(200).optional(),
    targetDate: z.string().datetime().optional().nullable(),
    formData: z.object({}).passthrough().optional(),
});

export const BriefingUpdateSchema = z.object({
    clientName: z.string().min(1).max(200).optional(),
    productName: z.string().min(1).max(200).optional(),
    category: z.string().max(100).optional(),
    status: z.string().max(50).optional(),
    responsableComercial: z.string().max(200).optional(),
    responsableTecnico: z.string().max(200).optional(),
});

export type BriefingCreateInput = z.infer<typeof BriefingCreateSchema>;
export type BriefingUpdateInput = z.infer<typeof BriefingUpdateSchema>;

// ============================================================================
// FORMULA SCHEMAS
// ============================================================================

export const FormulaCreateSchema = z.object({
    name: z.string().min(1).max(200),
    category: z.string().max(100).optional(),
    description: z.string().max(2000).optional(),
    ingredients: z.array(z.object({
        name: z.string().max(200),
        percentage: z.number().min(0).max(100),
        phase: z.string().max(50).optional(),
    })).optional(),
    briefingId: z.string().optional().nullable(),
    ownership: z.enum(['PROPIA', 'CLIENTE']).optional(),
});

export type FormulaCreateInput = z.infer<typeof FormulaCreateSchema>;

// ============================================================================
// RAW MATERIALS SCHEMAS
// ============================================================================

export const RawMaterialOrderSchema = z.object({
    supplierName: z.string().max(200).optional(),
    material: z.string().max(200).optional(),
    quantity: z.number().min(0).optional(),
    estimatedDate: z.string().datetime().optional().nullable(),
    unitsShipped: z.number().min(0).optional(),
    status: z.string().max(50).optional(),
});

export type RawMaterialOrderInput = z.infer<typeof RawMaterialOrderSchema>;

// ============================================================================
// PRODUCTION BLOCK SCHEMAS
// ============================================================================

export const ProductionBlockSchema = z.object({
    clientName: z.string().max(200).optional(),
    articleDesc: z.string().max(500).optional(),
    units: z.number().int().min(0).optional(),
    liters: z.number().min(0).optional(),
    reactorId: z.string().optional(),
    scheduledDate: z.string().datetime().optional().nullable(),
    status: z.enum(['PENDING', 'PLANNED', 'PRODUCED', 'SHIPPED']).optional(),
});

export type ProductionBlockInput = z.infer<typeof ProductionBlockSchema>;

