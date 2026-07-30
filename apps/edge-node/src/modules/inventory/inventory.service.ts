import { calculateIngredientDepletion, DishRecipe, RawIngredientRequirement } from '@rcms/bom-engine';

export interface OutletStockBalance {
  ingredientId: string;
  ingredientName: string;
  unitOfMeasure: string;
  initialStockQty: number;
  currentStockQty: number;
  unitCost: number;
  reorderLevel: number;
}

export interface WastageLogInput {
  ingredientId: string;
  quantityWasted: number;
  reason: 'BURNT' | 'EXPIRED' | 'SPILLAGE' | 'PREP_WASTE';
  loggedBy: string;
}

export class InventoryService {
  private stockBalances: Map<string, OutletStockBalance> = new Map();
  private recipes: Map<string, DishRecipe> = new Map();

  constructor() {
    this.seedInitialInventoryAndRecipes();
  }

  private seedInitialInventoryAndRecipes() {
    this.stockBalances.set('ing_chicken', {
      ingredientId: 'ing_chicken',
      ingredientName: 'Raw Chicken Breast',
      unitOfMeasure: 'kg',
      initialStockQty: 50.0,
      currentStockQty: 50.0,
      unitCost: 220,
      reorderLevel: 10.0,
    });

    this.stockBalances.set('ing_butter', {
      ingredientId: 'ing_butter',
      ingredientName: 'Cooking Butter',
      unitOfMeasure: 'kg',
      initialStockQty: 20.0,
      currentStockQty: 20.0,
      unitCost: 480,
      reorderLevel: 5.0,
    });

    this.recipes.set('item_butter_chicken', {
      menuItemId: 'item_butter_chicken',
      dishName: 'Butter Chicken',
      components: [
        {
          ingredientId: 'ing_chicken',
          ingredientName: 'Raw Chicken Breast',
          unitOfMeasure: 'kg',
          quantityPerServing: 0.25,
          yieldPercentage: 85,
          wastageAllowancePct: 5,
        },
        {
          ingredientId: 'ing_butter',
          ingredientName: 'Cooking Butter',
          unitOfMeasure: 'kg',
          quantityPerServing: 0.05,
          yieldPercentage: 98,
          wastageAllowancePct: 2,
        },
      ],
    });
  }

  processOrderStockDepletion(menuItemId: string, servingsSold: number): RawIngredientRequirement[] {
    const recipe = this.recipes.get(menuItemId);
    if (!recipe) return [];

    const requirements = calculateIngredientDepletion(recipe, servingsSold);

    for (const req of requirements) {
      const currentBalance = this.stockBalances.get(req.ingredientId);
      if (currentBalance) {
        currentBalance.currentStockQty = Number(
          (currentBalance.currentStockQty - req.grossQuantityRequired).toFixed(4),
        );
      }
    }

    return requirements;
  }

  logWastage(input: WastageLogInput): void {
    const balance = this.stockBalances.get(input.ingredientId);
    if (balance) {
      balance.currentStockQty = Number((balance.currentStockQty - input.quantityWasted).toFixed(4));
    }
  }

  getFoodCostPercentage(totalSalesAmount: number): { foodCostPct: number; totalCost: number } {
    let totalCost = 0;
    for (const balance of this.stockBalances.values()) {
      const consumedQty = balance.initialStockQty - balance.currentStockQty;
      if (consumedQty > 0) {
        totalCost += consumedQty * balance.unitCost;
      }
    }

    const foodCostPct = totalSalesAmount > 0 ? Number(((totalCost / totalSalesAmount) * 100).toFixed(2)) : 0;
    return { foodCostPct, totalCost: Number(totalCost.toFixed(2)) };
  }
}
