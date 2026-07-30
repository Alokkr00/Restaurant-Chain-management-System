import { Order, OrderStatus } from '@rcms/shared-types';

export interface LocalSyncQueueItem {
  id: string;
  eventType: string;
  payload: string; // JSON stringified
  createdAt: string;
  syncedAt?: string;
}

export class LocalDatabaseService {
  private memoryTables: Map<string, any[]> = new Map();

  async initialize(): Promise<void> {
    console.log('[LocalDB] Initializing local SQLite schema structure...');
    
    this.memoryTables.set('outlets', []);
    this.memoryTables.set('users', []);
    this.memoryTables.set('menu_items', []);
    this.memoryTables.set('table_states', []);
    this.memoryTables.set('orders', []);
    this.memoryTables.set('order_items', []);
    this.memoryTables.set('order_events', []);
    this.memoryTables.set('sync_queue', []);
    this.memoryTables.set('tax_config', []);

    console.log('[LocalDB] Schema structures initialized for 9 core tables.');
  }

  async saveOrder(order: Order): Promise<void> {
    const orders = this.memoryTables.get('orders') || [];
    orders.push(order);
    this.memoryTables.set('orders', orders);

    const syncQueue = this.memoryTables.get('sync_queue') || [];
    syncQueue.push({
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      eventType: 'ORDER_CREATED',
      payload: JSON.stringify(order),
      createdAt: new Date().toISOString(),
    });
    this.memoryTables.set('sync_queue', syncQueue);
  }

  async getPendingSyncEvents(): Promise<LocalSyncQueueItem[]> {
    const syncQueue: LocalSyncQueueItem[] = this.memoryTables.get('sync_queue') || [];
    return syncQueue.filter((item) => !item.syncedAt);
  }

  async getActiveOrders(): Promise<Order[]> {
    const orders: Order[] = this.memoryTables.get('orders') || [];
    return orders.filter((o) => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED);
  }
}
