// RCMS Shared Types Domain Model

export enum OrderType {
  DINE_IN = 'DINE_IN',
  TAKEAWAY = 'TAKEAWAY',
  DELIVERY = 'DELIVERY',
}

export enum OrderStatus {
  DRAFT = 'DRAFT',
  PLACED = 'PLACED',
  IN_KITCHEN = 'IN_KITCHEN',
  READY = 'READY',
  SERVED = 'SERVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum KDSItemStatus {
  PENDING = 'PENDING',
  COOKING = 'COOKING',
  READY = 'READY',
  BUMPED = 'BUMPED',
}

export enum KitchenStation {
  GRILL = 'GRILL',
  FRY = 'FRY',
  COLD = 'COLD',
  BAR = 'BAR',
}

export interface TaxBreakdown {
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  taxBreakdown: TaxBreakdown;
  totalPrice: number;
  station: KitchenStation;
  kdsStatus: KDSItemStatus;
  notes?: string;
}

export interface Order {
  id: string;
  outletId: string;
  orderNumber: string;
  tableId?: string;
  waiterId: string;
  orderType: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  totalTax: number;
  discountAmount: number;
  grandTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface SyncEventEnvelope<T = unknown> {
  eventId: string;
  outletId: string;
  deviceId: string;
  eventType: string;
  timestamp: number;
  vectorClock: Record<string, number>;
  payload: T;
}
