export interface Ingredient {
  code: string;
  name: string;
  unit: string;
  costPerUnit: number;
}

export interface RecipeItem {
  ingredientCode: string;
  grossQty: number; // Raw quantity required
  yieldPct: number; // e.g. 85 for 85% yield
  wastagePct: number; // e.g. 5 for 5% wastage
}

export interface MenuItemRecipe {
  menuItemId: string;
  dishName: string;
  recipeItems: RecipeItem[];
}

/**
 * 🥩 REAL BOM & INVENTORY DEPLETION ENGINE
 * Calculates exact raw ingredient depletion considering Yield % and Wastage %
 */
export class BOMCalculationEngine {
  private recipes: Map<string, MenuItemRecipe> = new Map();

  constructor() {
    this.seedDefaultRecipes();
  }

  private seedDefaultRecipes(): void {
    // 1. Butter Chicken (Half): 250g Chicken (85% yield, 5% waste), 50g Butter
    this.recipes.set('mi_butter_chicken_01', {
      menuItemId: 'mi_butter_chicken_01',
      dishName: 'Butter Chicken (Half)',
      recipeItems: [
        { ingredientCode: 'ING_CHICKEN_KG', grossQty: 0.25, yieldPct: 85, wastagePct: 5 },
        { ingredientCode: 'ING_BUTTER_KG', grossQty: 0.05, yieldPct: 100, wastagePct: 0 },
      ],
    });

    // 2. Paneer Tikka: 200g Paneer (90% yield, 2% waste), 30g Butter
    this.recipes.set('mi_paneer_tikka_02', {
      menuItemId: 'mi_paneer_tikka_02',
      dishName: 'Paneer Tikka',
      recipeItems: [
        { ingredientCode: 'ING_PANEER_KG', grossQty: 0.20, yieldPct: 90, wastagePct: 2 },
        { ingredientCode: 'ING_BUTTER_KG', grossQty: 0.03, yieldPct: 100, wastagePct: 0 },
      ],
    });

    // 3. Dal Makhani: 40g Butter
    this.recipes.set('mi_dal_makhani_03', {
      menuItemId: 'mi_dal_makhani_03',
      dishName: 'Dal Makhani',
      recipeItems: [
        { ingredientCode: 'ING_BUTTER_KG', grossQty: 0.04, yieldPct: 100, wastagePct: 0 },
      ],
    });

    // 4. Chicken Biryani: 300g Chicken (85% yield, 5% waste), 30g Butter
    this.recipes.set('mi_chicken_biryani_04', {
      menuItemId: 'mi_chicken_biryani_04',
      dishName: 'Dum Chicken Biryani',
      recipeItems: [
        { ingredientCode: 'ING_CHICKEN_KG', grossQty: 0.30, yieldPct: 85, wastagePct: 5 },
        { ingredientCode: 'ING_BUTTER_KG', grossQty: 0.03, yieldPct: 100, wastagePct: 0 },
      ],
    });

    // 5. Butter Naan: 100g Flour (95% yield, 2% waste), 15g Butter
    this.recipes.set('mi_butter_naan_05', {
      menuItemId: 'mi_butter_naan_05',
      dishName: 'Butter Naan',
      recipeItems: [
        { ingredientCode: 'ING_FLOUR_KG', grossQty: 0.10, yieldPct: 95, wastagePct: 2 },
        { ingredientCode: 'ING_BUTTER_KG', grossQty: 0.015, yieldPct: 100, wastagePct: 0 },
      ],
    });
  }

  /**
   * CALCULATE EXACT REQUIRED INGREDIENT DEPLETION FOR DISH ORDER
   * Formula: Depletion = GrossQty / (Yield% / 100) * (1 + Wastage% / 100) * PortionQuantity
   */
  public calculateDepletion(menuItemId: string, portionQty: number): Array<{ ingredientCode: string; qtyToDeduct: number }> {
    const recipe = this.recipes.get(menuItemId);
    if (!recipe) return [];

    return recipe.recipeItems.map(item => {
      const yieldFactor = item.yieldPct / 100;
      const wasteFactor = 1 + (item.wastagePct / 100);
      const netRequiredPerPortion = (item.grossQty / yieldFactor) * wasteFactor;
      const totalDeduction = Number((netRequiredPerPortion * portionQty).toFixed(4));

      return {
        ingredientCode: item.ingredientCode,
        qtyToDeduct: totalDeduction,
      };
    });
  }
}
