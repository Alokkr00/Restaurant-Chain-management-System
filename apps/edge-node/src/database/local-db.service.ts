import * as fs from 'fs';
import * as path from 'path';
import { Order } from '@rcms/shared-types';

export interface LocalMenuItem {
  id: string;
  sku: string;
  name: string;
  cat: string;
  station: string;
  price: number;
  isAvailable: boolean;
  image?: string;
}

export class LocalDatabaseService {
  private dbPath = path.join(process.cwd(), 'data', 'outlet_edge.json');
  private menuItems: LocalMenuItem[] = [];
  private orders: Order[] = [];

  public async initialize(): Promise<void> {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        const data = JSON.parse(raw);
        this.menuItems = data.menuItems || this.getDefaultMenuItems();
        this.orders = data.orders || [];
        console.log(`[LocalDB] Loaded persistent database from disk (${this.menuItems.length} menu items, ${this.orders.length} orders).`);
      } catch (err) {
        console.warn(`[LocalDB] Could not parse disk DB, falling back to default seed data.`);
        this.menuItems = this.getDefaultMenuItems();
        this.persist();
      }
    } else {
      this.menuItems = this.getDefaultMenuItems();
      this.persist();
      console.log(`[LocalDB] Initialized seed database with ${this.menuItems.length} menu items.`);
    }
  }

  private getDefaultMenuItems(): LocalMenuItem[] {
    return [
      { id: 'mi_butter_chicken_01', sku: 'SKU-BC-01', name: 'Butter Chicken (Half)', cat: 'cat_mains', station: 'GRILL', price: 350, isAvailable: true, image: '/pos/assets/images/butter_chicken.jpg' },
      { id: 'mi_paneer_tikka_02', sku: 'SKU-PT-02', name: 'Paneer Tikka', cat: 'cat_starters', station: 'GRILL', price: 280, isAvailable: true, image: '/pos/assets/images/paneer_tikka.jpg' },
      { id: 'mi_dal_makhani_03', sku: 'SKU-DM-03', name: 'Dal Makhani', cat: 'cat_mains', station: 'GRILL', price: 240, isAvailable: true, image: '/pos/assets/images/dal_makhani.jpg' },
      { id: 'mi_chicken_biryani_04', sku: 'SKU-CB-04', name: 'Dum Chicken Biryani', cat: 'cat_mains', station: 'GRILL', price: 380, isAvailable: true, image: '/pos/assets/images/chicken_biryani.jpg' },
      { id: 'mi_butter_naan_05', sku: 'SKU-BN-05', name: 'Butter Naan', cat: 'cat_breads', station: 'GRILL', price: 60, isAvailable: true },
      { id: 'mi_masala_chai_06', sku: 'SKU-MC-06', name: 'Cutting Masala Chai', cat: 'cat_beverages', station: 'BAR', price: 40, isAvailable: true },
      { id: 'mi_gulab_jamun_07', sku: 'SKU-GJ-07', name: 'Gulab Jamun (2 pcs)', cat: 'cat_desserts', station: 'COLD', price: 120, isAvailable: true }
    ];
  }

  private persist(): void {
    try {
      const data = {
        menuItems: this.menuItems,
        orders: this.orders,
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error(`[LocalDB Error] Persistent write failed:`, (err as Error).message);
    }
  }

  public getMenuItems(): LocalMenuItem[] {
    return this.menuItems;
  }

  public getOrders(): Order[] {
    return this.orders;
  }

  public addMenuItem(item: { name: string; cat: string; price: number; station: string }): LocalMenuItem {
    const newItem: LocalMenuItem = {
      id: `mi_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sku: `SKU-CUST-${Math.floor(100 + Math.random() * 900)}`,
      name: item.name,
      cat: item.cat,
      price: item.price,
      station: item.station || 'GRILL',
      isAvailable: true
    };
    this.menuItems.push(newItem);
    this.persist();
    return newItem;
  }

  public removeMenuItem(id: string): boolean {
    const initLen = this.menuItems.length;
    this.menuItems = this.menuItems.filter(m => m.id !== id);
    if (this.menuItems.length !== initLen) {
      this.persist();
      return true;
    }
    return false;
  }

  public async saveOrder(order: Order): Promise<void> {
    this.orders.push(order);
    this.persist();
  }
}
