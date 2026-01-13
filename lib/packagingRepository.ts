
export interface PackagingRule {
    container: string;
    subtype: string;
    capacityMin: number;
    capacityMax: number;
    operation: string;
    scaleMin: number;
    scaleMax: number;
    unitCost: number;
    people?: number;
}

export class PackagingRepository {
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

    getAvailableOperations(container: string, subtype: string, capacity: number): string[] {
        const filtered = this.rules.filter(r =>
            r.container === container &&
            r.subtype === subtype &&
            capacity >= r.capacityMin &&
            capacity <= r.capacityMax
        );
        return Array.from(new Set(filtered.map(r => r.operation))).sort();
    }

    getOperationCost(container: string, subtype: string, capacity: number, quantity: number, operation: string): number {
        const candidates = this.rules.filter(r =>
            r.container === container &&
            r.subtype === subtype &&
            capacity >= r.capacityMin &&
            capacity <= r.capacityMax &&
            r.operation === operation
        );

        if (candidates.length === 0) return 0;

        // Find scale bracket
        const match = candidates.find(r => quantity > r.scaleMin && quantity <= r.scaleMax);
        if (match) return match.unitCost;

        // Fallback: Use the one with the highest scaleMax if Qty > all
        // Or lowest if Qty < all (though scaleMin usually starts at 0)
        // Let's sort by scaleMax
        candidates.sort((a, b) => a.scaleMax - b.scaleMax);

        if (quantity > candidates[candidates.length - 1].scaleMax) {
            return candidates[candidates.length - 1].unitCost;
        }

        // If not found (extremely rare if data covers 0-Infinity), return 0 or first
        return candidates[0].unitCost;
    }

    getOperationPeople(container: string, subtype: string, capacity: number, quantity: number, operation: string): number {
        const candidates = this.rules.filter(r =>
            r.container === container &&
            r.subtype === subtype &&
            capacity >= r.capacityMin &&
            capacity <= r.capacityMax &&
            r.operation === operation
        );

        if (candidates.length === 0) return 0;

        const match = candidates.find(r => quantity > r.scaleMin && quantity <= r.scaleMax);
        if (match) return match.people || 0;

        candidates.sort((a, b) => a.scaleMax - b.scaleMax);
        if (quantity > candidates[candidates.length - 1].scaleMax) {
            return candidates[candidates.length - 1].people || 0;
        }
        return candidates[0].people || 0;
    }
}
