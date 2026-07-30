import { OrderItem, KDSItemStatus, KitchenStation } from '@rcms/shared-types';
import { calculateGST } from '@rcms/gst-engine';

export interface CartItemInput {
  menuItemId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  station: KitchenStation;
  selectedModifiers?: { id: string; name: string; priceDelta: number }[];
  notes?: string;
}

export class CartStore {
  private items: OrderItem[] = [];
  private tableId: string | null = null;
  private waiterId: string | null = null;

  setTable(tableId: string): void {
    this.tableId = tableId;
  }

  setWaiter(waiterId: string): void {
    this.waiterId = waiterId;
  }

  addItem(input: CartItemInput): OrderItem {
    const modifierTotal = (input.selectedModifiers || []).reduce((sum, m) => sum + m.priceDelta, 0);
    const effectiveUnitPrice = input.unitPrice + modifierTotal;
    const subtotal = effectiveUnitPrice * input.quantity;
    const taxBreakdown = calculateGST(subtotal);
    const totalPrice = Number((subtotal + taxBreakdown.totalTax).toFixed(2));

    const orderItem: OrderItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orderId: '',
      menuItemId: input.menuItemId,
      itemName: input.itemName,
      unitPrice: effectiveUnitPrice,
      quantity: input.quantity,
      subtotal,
      taxBreakdown,
      totalPrice,
      station: input.station,
      kdsStatus: KDSItemStatus.PENDING,
      notes: input.notes,
    };

    this.items.push(orderItem);
    return orderItem;
  }

  removeItem(itemId: string): void {
    this.items = this.items.filter((i) => i.id !== itemId);
  }

  getItems(): OrderItem[] {
    return this.items;
  }

  getTotals() {
    const subtotal = Number(this.items.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2));
    const totalTax = Number(this.items.reduce((sum, i) => sum + i.taxBreakdown.totalTax, 0).toFixed(2));
    const grandTotal = Number((subtotal + totalTax).toFixed(2));

    return {
      itemCount: this.items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal,
      totalTax,
      grandTotal,
    };
  }

  clearCart(): void {
    this.items = [];
    this.tableId = null;
  }
}
