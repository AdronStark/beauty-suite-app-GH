import { prisma } from '@/lib/db/prisma';
import { SchemaType } from "@google/generative-ai";

// 1. Tool Definitions for Gemini
export const toolsDefinition = [
    {
        functionDeclarations: [
            {
                name: "get_offers_stats",
                description: "Obtiene estadísticas sobre las ofertas (cantidad, estados) en un rango de fechas o general.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        status: { type: SchemaType.STRING, description: "Filtrar por estado (Borrador, Validada, Enviada, Adjudicada, Rechazada)" },
                        month: { type: SchemaType.STRING, description: "Filtrar por mes (formato 'YYYY-MM')" }
                    }
                }
            },
            {
                name: "search_clients",
                description: "Busca clientes en la base de datos por nombre.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        query: { type: SchemaType.STRING, description: "Nombre o parte del nombre del cliente" }
                    },
                    required: ["query"]
                }
            }
        ]
    }
];

// 2. Tool Implementations (Backend Execution)
export const toolsImplementation = {
    get_offers_stats: async (args: any) => {
        const where: any = {};

        if (args.status) {
            where.status = args.status;
        }

        if (args.month) {
            const date = new Date(args.month + '-01');
            const start = new Date(date.getFullYear(), date.getMonth(), 1);
            const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            where.createdAt = { gte: start, lte: end };
        }

        const count = await prisma.offer.count({ where });
        const total = await prisma.offer.count();

        // Also get breakdown by status if no status filter
        let breakdown = '';
        if (!args.status) {
            const groups = await prisma.offer.groupBy({
                by: ['status'],
                _count: true
            });
            breakdown = groups.map(g => `${g.status}: ${g._count}`).join(', ');
        }

        return `En total he encontrado ${count} ofertas${args.status ? ` con estado ${args.status}` : ''}. ${breakdown ? `Desglose: ${breakdown}` : ''}`;
    },

    search_clients: async (args: any) => {
        // Since we don't have a Client model in the provided schema snippet (based on prev reads),
        // we might be storing client strings in Offers or configuration.
        // Assuming we look at distinct client strings in Config or Offers for now to simulate.
        // OR better, we look at `Offer` client field.

        const clients = await prisma.offer.findMany({
            where: {
                client: { contains: args.query }
            },
            select: { client: true },
            distinct: ['client'],
            take: 5
        });

        if (clients.length === 0) return "No he encontrado clientes con ese nombre.";
        return `He encontrado estos clientes: ${clients.map(c => c.client).join(', ')}`;
    }
};
