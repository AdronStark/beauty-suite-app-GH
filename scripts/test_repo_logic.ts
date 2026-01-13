
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Inlined Class
interface PackagingRule {
    container: string;
    subtype: string;
    capacityMin: number;
    capacityMax: number;
    operation: string;
    scaleMin: number;
    scaleMax: number;
    unitCost: number;
}

class PackagingRepository {
    private rules: PackagingRule[] = [];

    constructor(rulesJson: string | PackagingRule[] | null) {
        if (!rulesJson) {
            this.rules = [];
            return;
        }
        if (typeof rulesJson === 'string') {
            try {
                this.rules = JSON.parse(rulesJson);
            } catch (e) {
                console.error("Failed to parse packaging rules", e);
                this.rules = [];
            }
        } else {
            this.rules = rulesJson;
        }
    }

    getContainerTypes(): string[] {
        return Array.from(new Set(this.rules.map(r => r.container))).sort();
    }

    getSubtypes(container: string): string[] {
        return Array.from(new Set(
            this.rules
                .filter(r => r.container === container)
                .map(r => r.subtype)
        )).sort();
    }
}

async function main() {
    console.log('Fetching config...');
    const config = await prisma.configuration.findUnique({
        where: { key: 'OFFER_PACKAGING_RULES' }
    });

    if (!config) {
        console.error('No config found.');
        return;
    }

    console.log('Initializing Repository...');
    const repo = new PackagingRepository(config.value);

    console.log('Rules loaded:', (repo as any).rules.length);

    console.log('Getting Container Types...');
    const types = repo.getContainerTypes();
    console.log('Types:', types);

    if (types.length > 0) {
        const firstType = types[0];
        console.log(`Getting Subtypes for ${firstType}...`);
        const subtypes = repo.getSubtypes(firstType);
        console.log('Subtypes:', subtypes);
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
