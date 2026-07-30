import { BOMCalculationEngine } from '@rcms/bom-engine';

export class InventoryService {
  private bomEngine = new BOMCalculationEngine();

  public processOrderStockDepletion(menuItemId: string, portionQty: number): Array<{ ingredientCode: string; qtyToDeduct: number }> {
    return this.bomEngine.calculateDepletion(menuItemId, portionQty);
  }
}
