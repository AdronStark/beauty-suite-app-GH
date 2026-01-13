import { z } from 'zod';
import { SHIFTS } from './planner-constants';

const ShiftEnum = z.enum(SHIFTS as any as [string, ...string[]]);

export const ProductionBlockSchema = z.object({
    id: z.string().optional(),
    articleCode: z.string().min(1, "Código de artículo requerido"),
    articleDesc: z.string().optional(),
    units: z.number().positive("Las unidades deben ser positivas"),
    unitsOrdered: z.number().nonnegative().optional(),
    unitsServed: z.number().nonnegative().optional(),
    unitsPending: z.number().nonnegative().optional(),
    clientName: z.string().optional(),
    orderNumber: z.string().optional(),
    deadline: z.coerce.date().nullable().optional(),
    orderDate: z.coerce.date().nullable().optional(),

    // Planning
    status: z.enum(['PENDING', 'PLANNED', 'PRODUCED', 'CANCELLED']).default('PENDING'),
    plannedDate: z.coerce.date().nullable().optional(),
    plannedReactor: z.string().nullable().optional(),
    plannedShift: ShiftEnum.nullable().optional(),
    batchLabel: z.string().nullable().optional(),

    // Execution
    realKg: z.number().nullable().optional(),
    realDuration: z.number().nullable().optional(),
    operatorNotes: z.string().nullable().optional(),

    parentId: z.string().nullable().optional(),
});

export type ProductionBlockInput = z.infer<typeof ProductionBlockSchema>;
