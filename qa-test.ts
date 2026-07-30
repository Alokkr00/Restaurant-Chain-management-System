import { calculateGST } from './packages/gst-engine/src';
console.log('GST 0 amount:', calculateGST(0, { isInterState: true, defaultTaxRate: 18 }));
console.log('GST high decimal:', calculateGST(1234.5678, { isInterState: true, defaultTaxRate: 18 }));
console.log('GST inter-state:', calculateGST(1000, { isInterState: true, defaultTaxRate: 18 }));
console.log('GST intra-state:', calculateGST(1000, { isInterState: false, defaultTaxRate: 18 }));

import { calculateIngredientDepletion, DishRecipe } from './packages/bom-engine/src';
const recipe1: DishRecipe = {
  menuItemId: "item1",
  dishName: "Test Dish 1",
  components: [
    { ingredientId: "ing1", ingredientName: "Ing 1", unitOfMeasure: "g", quantityPerServing: 10, yieldPercentage: 100, wastageAllowancePct: 0 }
  ]
};
console.log('BOM 100% yield, 0% wastage:', calculateIngredientDepletion(recipe1, 1));

const recipe2: DishRecipe = {
  menuItemId: "item2",
  dishName: "Test Dish 2",
  components: [
    { ingredientId: "ing2", ingredientName: "Ing 2", unitOfMeasure: "g", quantityPerServing: 10, yieldPercentage: 85, wastageAllowancePct: 5 }
  ]
};
console.log('BOM 85% yield, 5% wastage:', calculateIngredientDepletion(recipe2, 1));
