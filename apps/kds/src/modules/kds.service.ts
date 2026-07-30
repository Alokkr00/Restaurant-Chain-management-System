import { OrderItem, KitchenStation, KDSItemStatus } from '@rcms/shared-types';

export interface KDSTicketItem {
  id: string;
  orderId: string;
  orderNumber: string;
  tableId?: string;
  itemName: string;
  quantity: number;
  station: KitchenStation;
  status: KDSItemStatus;
  notes?: string;
  placedAt: string;
  elapsedMinutes: number;
  timerColor: 'GREEN' | 'YELLOW' | 'RED';
}

export class KDSService {
  private activeItems: KDSTicketItem[] = [];

  loadItemsFromOrder(orderId: string, orderNumber: string, tableId: string | undefined, items: OrderItem[]): void {
    const now = new Date();
    for (const item of items) {
      this.activeItems.push({
        id: item.id,
        orderId,
        orderNumber,
        tableId,
        itemName: item.itemName,
        quantity: item.quantity,
        station: item.station,
        status: item.kdsStatus || KDSItemStatus.PENDING,
        notes: item.notes,
        placedAt: now.toISOString(),
        elapsedMinutes: 0,
        timerColor: 'GREEN',
      });
    }
  }

  getTicketsForStation(station: KitchenStation): KDSTicketItem[] {
    const now = Date.now();
    return this.activeItems
      .filter((i) => i.station === station && i.status !== KDSItemStatus.BUMPED)
      .map((item) => {
        const elapsedMin = Math.floor((now - new Date(item.placedAt).getTime()) / 60000);
        let timerColor: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
        if (elapsedMin >= 10) timerColor = 'RED';
        else if (elapsedMin >= 5) timerColor = 'YELLOW';

        return {
          ...item,
          elapsedMinutes: elapsedMin,
          timerColor,
        };
      });
  }

  bumpItem(itemId: string): KDSTicketItem | null {
    const item = this.activeItems.find((i) => i.id === itemId);
    if (!item) return null;

    if (item.status === KDSItemStatus.PENDING) {
      item.status = KDSItemStatus.COOKING;
    } else if (item.status === KDSItemStatus.COOKING || item.status === KDSItemStatus.READY) {
      item.status = KDSItemStatus.BUMPED;
    }

    return item;
  }
}
