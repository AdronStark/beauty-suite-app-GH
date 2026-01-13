import { PackagingRepository } from './packagingRepository';
export interface OfferCalculationResult {
    bulkCostUnit: number;
    packingCostUnit: number;
    processCostUnit: number;
    extrasCostUnit: number;
    residueCostUnit: number;
    directCost: number;
    salePrice: number;
    profit: number;
    totalBulkCost: number;
    derivedUnits: number;
    details?: {
        totalMaterialCost: number;
        mfgCost: number;
        totalImputedSurplus: number;
        packagingMaterialCost: number;
        packagingFillingCost: number;
    }
}

export function calculateOfferCosts(values: any, config: any): OfferCalculationResult {
    // 1. Inputs & Units
    const batchSizeKg = parseFloat(values.totalBatchKg) || 0;
    const unitSize = parseFloat(values.unitSize) || 0;
    const density = parseFloat(values.density) || 1;

    // Calculate Units derived from inputs
    // Units = (Kg * 1000) / (ml * density)
    const derivedUnits = (unitSize > 0 && density > 0)
        ? (batchSizeKg * 1000) / (unitSize * density)
        : 0;

    const units = derivedUnits; // Use derived units for all checks

    // 2. Bulk Cost
    let materialCostKg = 0;
    if (values.bulkCostMode === 'manual') {
        materialCostKg = parseFloat(values.manualBulkCost) || 0;
    } else {
        materialCostKg = (values.formula || []).reduce((sum: number, item: any) => {
            if (item.clientSupplied) return sum;
            return sum + ((parseFloat(item.costPerKg) || 0) * ((parseFloat(item.percentage) || 0) / 100));
        }, 0);
    }

    // Rate Lookup based on Material Cost
    let hourlyRate = 120.00;
    if (config.OFFER_RATES_SCALING) {
        try {
            const rates = JSON.parse(config.OFFER_RATES_SCALING);
            const found = rates.find((r: any) => materialCostKg >= parseFloat(r.min) && materialCostKg <= parseFloat(r.max));
            if (found) hourlyRate = parseFloat(found.value);
        } catch (e) { }
    }

    // Bulk Waste Lookup based on Batch Size
    let bulkWastePercent = 3.0;
    if (config.OFFER_WASTE_SCALING) {
        try {
            const rules = JSON.parse(config.OFFER_WASTE_SCALING);
            const found = rules.find((r: any) => batchSizeKg >= parseFloat(r.min) && batchSizeKg <= parseFloat(r.max));
            if (found) bulkWastePercent = parseFloat(found.value);
        } catch (e) { }
    }

    // Calculate Bulk Totals
    const totalMaterialCost = (materialCostKg * batchSizeKg) * (1 + (bulkWastePercent / 100));

    // Calculate Imputed Surplus Cost (MOQ)
    const totalImputedSurplus = (values.formula || []).reduce((sum: number, item: any) => {
        if (!item.imputeSurplus) return sum;
        const pct = parseFloat(item.percentage) || 0;
        const cost = parseFloat(item.costPerKg) || 0;
        const minPurchase = parseFloat(item.minPurchase) || 0;
        const requiredKg = (batchSizeKg * pct) / 100;
        const surplusKg = Math.max(0, minPurchase - requiredKg);
        return sum + (surplusKg * cost);
    }, 0);

    const timeMinutes = parseFloat(values.manufacturingTime) || 120;
    const mfgCost = (timeMinutes / 60) * hourlyRate;
    const totalBulkCost = totalMaterialCost + mfgCost + totalImputedSurplus;
    const bulkCostUnit = units > 0 ? totalBulkCost / units : 0;

    // 3. Packaging Cost
    const packingCostUnit = (values.packaging || []).reduce((sum: number, item: any) => {
        if (item.clientSupplied) return sum;
        const c = parseFloat(item.costPerUnit) || 0;
        const w = parseFloat(item.wastePercent) || 0;
        return sum + (c * (1 + (w / 100)));
    }, 0);

    // 4. Process (Filling/Envasado)
    let fillingCostUnit = 0;
    const selectedOps = values.selectedOperations || [];

    if (config.OFFER_PACKAGING_RULES && selectedOps.length > 0) {
        const repo = new PackagingRepository(config.OFFER_PACKAGING_RULES);
        const cType = values.containerType;
        const cSub = values.subtype;
        const cap = parseFloat(values.capacity) || 0;

        fillingCostUnit = selectedOps.reduce((sum: number, op: string) => {
            return sum + repo.getOperationCost(cType, cSub, cap, units, op);
        }, 0);
    } else {
        // Fallback to Manual Speed Logic
        // FIX: Ensure we only charge if there is actually something to fill
        const hasPackaging = (values.packaging && values.packaging.length > 0);
        const hasContainer = !!values.containerType;
        // If no packaging items and no container type selected, assume 0 cost unless speed is explicitly manually modified?
        // Safest: if no packaging and no container, cost is 0.
        if (!hasPackaging && !hasContainer) {
            fillingCostUnit = 0;
        } else {
            const RATE_FILLING = 35.00;
            const RATE_LABOUR = 22.00;
            const speed = parseFloat(values.fillingSpeed) || 1500;
            const people = parseFloat(values.fillingPeople) || 1;

            const fillingTimeHours = speed > 0 ? units / speed : 0;
            const fillingCostTotal = fillingTimeHours * (RATE_FILLING + (people * RATE_LABOUR));
            fillingCostUnit = units > 0 ? fillingCostTotal / units : 0;
        }
    }

    const processCostUnit = fillingCostUnit;

    // 5. Extras
    const selectedExtras = values.extras || [];
    let extrasCostTotal = 0;
    let extrasCostUnitVariable = 0;

    selectedExtras.forEach((ex: any) => {
        const qty = parseFloat(ex.quantity) || 1;
        const cost = parseFloat(ex.cost) || 0;

        if (ex.type === 'FIXED') {
            extrasCostTotal += (cost * qty);
        } else {
            extrasCostUnitVariable += (cost * qty);
        }
    });

    const extrasCostUnit = (units > 0 ? (extrasCostTotal / units) : 0) + extrasCostUnitVariable;

    // 6. Residue (Recargo)
    let residuePercent = 0;
    if (config.OFFER_RESIDUE_SCALING) {
        try {
            const rules = JSON.parse(config.OFFER_RESIDUE_SCALING);
            const found = rules.find((r: any) => batchSizeKg >= parseFloat(r.min) && batchSizeKg <= parseFloat(r.max));
            if (found) residuePercent = parseFloat(found.value);
        } catch (e) { }
    }

    const preResidueUnitTotal = bulkCostUnit + packingCostUnit + processCostUnit + extrasCostUnit;
    // Calculate total cost for the whole batch to apply residue %
    const preResidueTotal = preResidueUnitTotal * units;
    const residueCostTotal = preResidueTotal * (residuePercent / 100);
    const residueCostUnit = units > 0 ? residueCostTotal / units : 0;

    // 7. Final Totals
    const directCost = preResidueUnitTotal + residueCostUnit;

    const marginInput = parseFloat(values.marginPercent);
    const margin = !isNaN(marginInput) ? marginInput : 30; // Use fixed 0 logic

    let salePrice = 0;
    if (margin < 100) {
        salePrice = directCost / (1 - (margin / 100));
    }

    const profit = salePrice - directCost;

    // Expose granular details for UI
    const packagingMaterialCost = packingCostUnit * units;
    const packagingFillingCost = processCostUnit * units;

    return {
        bulkCostUnit,
        packingCostUnit,
        processCostUnit,
        extrasCostUnit,
        residueCostUnit,
        directCost,
        salePrice,
        profit,
        totalBulkCost,
        derivedUnits,
        // Detailed Construction for Sidebar
        details: {
            totalMaterialCost,
            mfgCost,
            totalImputedSurplus,
            packagingMaterialCost,
            packagingFillingCost
        }
    };
}

export function calculateScenarioResults(scenario: any, baseValues: any, config: any) {
    const ml = parseFloat(baseValues.unitSize) || 0;
    const density = parseFloat(baseValues.density) || 0;

    let derivedKg = 0;
    let derivedUnits = 0;

    // Handle legacy number[] format for backward compatibility
    if (typeof scenario === 'number') {
        derivedUnits = scenario;
        derivedKg = (ml > 0 && density > 0) ? (scenario * ml * density) / 1000 : 0;
    } else {
        // Handle new { qty, mode, margin } format
        if (scenario.mode === 'UNITS') {
            derivedUnits = scenario.qty;
            derivedKg = (ml > 0 && density > 0) ? (scenario.qty * ml * density) / 1000 : 0;
        } else {
            // KG Mode
            derivedKg = scenario.qty;
            derivedUnits = (ml > 0 && density > 0) ? (scenario.qty * 1000) / (ml * density) : 0;
        }
    }

    const scenarioValues = {
        ...baseValues,
        totalBatchKg: derivedKg,
    };

    const results = calculateOfferCosts(scenarioValues, config);

    // Recalculate Sale Price based on Scenario Margin override if present
    let salePrice = results.salePrice;

    // Robustly check for margin presence (handle string numbers)
    let scenarioMargin = undefined;
    if (scenario && scenario.margin !== undefined && scenario.margin !== null && scenario.margin !== '') {
        scenarioMargin = parseFloat(scenario.margin);
    }

    if (typeof scenarioMargin === 'number' && !isNaN(scenarioMargin)) {
        if (scenarioMargin < 100) {
            salePrice = results.directCost / (1 - (scenarioMargin / 100));
        }
    }

    return {
        ...results,
        salePrice, // Override with specific margin price
        derivedUnits, // Ensure we return the specific units for this scenario context
        profit: salePrice - results.directCost
    };
}
