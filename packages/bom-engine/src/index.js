"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateIngredientDepletion = calculateIngredientDepletion;
/**
 * Calculates total raw ingredient depletion for a given quantity of dishes sold.
 * Equation: Gross Qty = (Net Qty / (Yield% / 100)) * (1 + Wastage% / 100) * Quantity
 */
function calculateIngredientDepletion(recipe, servingsSold) {
    return recipe.components.map((comp) => {
        const yieldMultiplier = comp.yieldPercentage > 0 ? comp.yieldPercentage / 100 : 1.0;
        const wastageMultiplier = 1 + (comp.wastageAllowancePct || 0) / 100;
        const singleServingGross = (comp.quantityPerServing / yieldMultiplier) * wastageMultiplier;
        const totalGrossQty = Number((singleServingGross * servingsSold).toFixed(4));
        return {
            ingredientId: comp.ingredientId,
            ingredientName: comp.ingredientName,
            unitOfMeasure: comp.unitOfMeasure,
            grossQuantityRequired: totalGrossQty,
        };
    });
}
//# sourceMappingURL=index.js.map