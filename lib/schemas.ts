import { z } from 'zod';

// CRM: Sales Budget Schema
export const SalesBudgetSchema = z.object({
    id: z.string().optional(), // Optional for creates, required for updates sometimes
    year: z.coerce.number().int().min(2020).max(2100), // Force number, reasonable range
    companyId: z.string().min(1, "Company ID is required"),
    client: z.string().min(1, "Client name is required"),
    amount: z.coerce.number().min(0, "Amount must be positive"), // Force number
});

export type SalesBudgetInput = z.infer<typeof SalesBudgetSchema>;

// USER: Creation Schema
export const UserCreateSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 chars"),
    password: z.string().min(6, "Password must be at least 6 chars"),
    name: z.string().min(1, "Display Name is required"),
    firstName: z.string().optional(),
    lastName1: z.string().optional(),
    lastName2: z.string().optional(),
    role: z.enum(['ADMIN', 'USER', 'MANAGER']), // Add other roles if they exist
    companies: z.array(z.string()).optional(), // Expecting array of company IDs
    isTechnical: z.boolean().optional(),
    isCommercial: z.boolean().optional(),
    position: z.string().optional(),
    connectedClientName: z.string().optional(),
});
