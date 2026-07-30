import * as fs from 'fs';
import * as path from 'path';
import { Order, OrderStatus } from '@rcms/shared-types';

export interface MenuItemRecord {
  id: string;
  cat: string;
  name: string;
  price: number;
  station: 'GRILL' | 'FRY' | 'COLD' | 'BAR';
  image?: string;
  isActive: boolean;
}

export interface LocalSyncQueueItem {
  id: string;
  eventType: string;
  payload: string;
  createdAt: string;
  syncedAt?: string;
}

export interface DBData {
  menuItems: MenuItemRecord[];
  orders: Order[];
  syncQueue: LocalSyncQueueItem[];
}

export class LocalDatabaseService {
  private dbPath = path.resolve(__dirname, '../../../../data/outlet_edge.json');
  private data: DBData = {
    menuItems: [
      { id: 'item_butter_chicken', cat: 'cat_mains', name: 'Butter Chicken', price: 350, station: 'GRILL', image: '/pos/assets/images/butter_chicken.jpg', isActive: true },
      { id: 'item_paneer_tikka', cat: 'cat_starters', name: 'Paneer Tikka', price: 280, station: 'GRILL', image: '/pos/assets/images/paneer_tikka.jpg', isActive: true },
      { id: 'item_dal_makhani', cat: 'cat_mains', name: 'Dal Makhani', price: 260, station: 'FRY', image: '/pos/assets/images/dal_makhani.jpg', isActive: true },
      { id: 'item_butter_naan', cat: 'cat_mains', name: 'Butter Naan', price: 60, station: 'GRILL', isActive: true },
      { id: 'item_masala_coke', cat: 'cat_beverages', name: 'Masala Coke', price: 90, station: 'BAR', isActive: true },
      { id: 'item_sweet_lassi', cat: 'cat_beverages', name: 'Sweet Lassi', price: 110, station: 'BAR', isActive: true },
      { id: 'item_chicken_biryani', cat: 'cat_mains', name: 'Chicken Biryani', price: 340, station: 'GRILL', image: '/pos/assets/images/chicken_biryani.jpg', isActive: true },
    ],
    orders: [],
    syncQueue: [],
  };

  async initialize(): Promise<void> {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        const parsed = JSON.parse(raw);
        // Ensure menu item images are populated
        this.data = parsed;
        let updated = false;
        this.data.menuItems.forEach((i) => {
          if (i.id === 'item_butter_chicken') { i.image = '/pos/assets/images/butter_chicken.jpg'; updated = true; }
          if (i.id === 'item_paneer_tikka') { i.image = '/pos/assets/images/paneer_tikka.jpg'; updated = true; }
          if (i.id === 'item_dal_makhani') { i.image = '/pos/assets/images/dal_makhani.jpg'; updated = true; }
          if (i.name === 'Chicken Biryani') { i.image = '/pos/assets/images/chicken_biryani.jpg'; updated = true; }
        });
        if (updated) this.persist();
        console.log(`[LocalDB] Loaded persistent database from disk (${this.data.menuItems.length} menu items, ${this.data.orders.length} orders).`);
      } catch (err) {
        console.warn('[LocalDB] Disk database corrupt/empty. Initializing fresh schema.');
        this.persist();
      }
    } else {
      this.persist();
      console.log('[LocalDB] Created fresh persistent disk database at:', this.dbPath);
    }
  }

  private persist(): void {
    fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf8');
  }

  // ==========================================
  // 🍽️ MENU ITEM CRUD (ADD & REMOVE)
  // ==========================================
  getMenuItems(): MenuItemRecord[] {
    return this.data.menuItems.filter((i) => i.isActive);
  }

  addMenuItem(item: Omit<MenuItemRecord, 'id' | 'isActive'>): MenuItemRecord {
    const newRecord: MenuItemRecord = {
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      isActive: true,
    };
    this.data.menuItems.push(newRecord);
    this.persist();
    console.log(`[LocalDB] Menu Item Added: "${newRecord.name}" (₹${newRecord.price}) [${newRecord.station}]`);
    return newRecord;
  }

  removeMenuItem(id: string): boolean {
    const item = this.data.menuItems.find((i) => i.id === id);
    if (!item) return false;

    item.isActive = false; // Soft delete / deactivate
    this.persist();
    console.log(`[LocalDB] Menu Item Removed/Deactivated: "${item.name}" (ID: ${id})`);
    return true;
  }

  // ==========================================
  // 🛒 ORDERS & SYNC QUEUE
  // ==========================================
  getOrders(): Order[] {
    return this.data.orders || [];
  }

  async saveOrder(order: Order): Promise<void> {
    this.data.orders.push(order);
    this.data.syncQueue.push({
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      eventType: 'ORDER_CREATED',
      payload: JSON.stringify(order),
      createdAt: new Date().toISOString(),
    });
    this.persist();
  }

  async getPendingSyncEvents(): Promise<LocalSyncQueueItem[]> {
    return this.data.syncQueue.filter((item) => !item.syncedAt);
  }
}
