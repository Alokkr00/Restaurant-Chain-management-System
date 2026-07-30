export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  BILLED = 'BILLED',
}

export interface RestaurantTable {
  id: string;
  tableNumber: string;
  capacity: number;
  section: 'MAIN_HALL' | 'OUTDOOR' | 'VIP';
  status: TableStatus;
  currentOrderId?: string;
  assignedWaiterId?: string;
}

export class TableService {
  private tables: RestaurantTable[] = [
    { id: 'tbl_1', tableNumber: 'Table 1', capacity: 2, section: 'MAIN_HALL', status: TableStatus.AVAILABLE },
    { id: 'tbl_2', tableNumber: 'Table 2', capacity: 4, section: 'MAIN_HALL', status: TableStatus.AVAILABLE },
    { id: 'tbl_3', tableNumber: 'Table 3', capacity: 6, section: 'MAIN_HALL', status: TableStatus.OCCUPIED, currentOrderId: 'ord_edge_1001', assignedWaiterId: 'usr_waiter_01' },
    { id: 'tbl_4', tableNumber: 'Table 4', capacity: 4, section: 'OUTDOOR', status: TableStatus.AVAILABLE },
    { id: 'tbl_5', tableNumber: 'VIP 1', capacity: 8, section: 'VIP', status: TableStatus.RESERVED },
  ];

  getTables(): RestaurantTable[] {
    return this.tables;
  }

  updateTableStatus(tableId: string, status: TableStatus, orderId?: string, waiterId?: string): RestaurantTable | null {
    const table = this.tables.find((t) => t.id === tableId);
    if (!table) return null;

    table.status = status;
    if (orderId) table.currentOrderId = orderId;
    if (waiterId) table.assignedWaiterId = waiterId;
    if (status === TableStatus.AVAILABLE) {
      table.currentOrderId = undefined;
      table.assignedWaiterId = undefined;
    }

    return table;
  }
}
