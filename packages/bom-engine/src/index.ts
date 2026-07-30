export interface RawIngredientRequirement {
  ingredientId: string;
  ingredientName: string;
  unitOfMeasure: string;
  grossQuantityRequired: number; // Accounts for yield % and wastage %
}

export interface BOMComponent {
  ingredientId: string;
  ingredientName: string;
  unitOfMeasure: string;
  quantityPerServing: number;
  yieldPercentage: number; // e.g. 85 for 85%
  wastageAllowancePct: number; // e.g. 5 for 5%
}

export interface DishRecipe {
  menuItemId: string;
  dishName: string;
  components: BOMComponent[];
}

/**
 * Calculates total raw ingredient depletion for a given quantity of dishes sold.
 * Equation: Gross Qty = (Net Qty / (Yield% / 100)) * (1 + Wastage% / 100) * Quantity
 */
export function calculateIngredientDepletion(
  recipe: DishRecipe,
  servingsSold: number,
): RawIngredientRequirement[] {
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
