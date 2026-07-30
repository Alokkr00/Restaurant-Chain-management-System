export interface RawIngredientRequirement {
    ingredientId: string;
    ingredientName: string;
    unitOfMeasure: string;
    grossQuantityRequired: number;
}
export interface BOMComponent {
    ingredientId: string;
    ingredientName: string;
    unitOfMeasure: string;
    quantityPerServing: number;
    yieldPercentage: number;
    wastageAllowancePct: number;
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
export declare function calculateIngredientDepletion(recipe: DishRecipe, servingsSold: number): RawIngredientRequirement[];
//# sourceMappingURL=index.d.ts.map