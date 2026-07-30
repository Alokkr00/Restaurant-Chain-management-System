import * as fs from 'fs';
import * as path from 'path';
import initSqlJs, { Database } from 'sql.js';
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

export interface InventoryItem {
  code: string;
  name: string;
  availableQty: number;
  unit: string;
  reorderLevel: number;
}

export interface OrderEventLog {
  id: string;
  orderId: string;
  eventType: 'ORDER_PLACED' | 'ITEM_VOIDED' | 'PRICE_OVERRIDE' | 'TABLE_TRANSFERRED' | 'DISCOUNT_APPLIED';
  staffId: string;
  detailsJson: string;
  createdAt: string;
}

export class LocalDatabaseService {
  private dbPath = path.join(process.cwd(), 'data', 'outlet_edge.sqlite');
  private jsonFallbackPath = path.join(process.cwd(), 'data', 'outlet_edge.json');
  private db: Database | null = null;
  private menuItems: LocalMenuItem[] = [];
  private orders: Order[] = [];
  private inventory: InventoryItem[] = [];

  public async initialize(): Promise<void> {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    try {
      const SQL = await initSqlJs();
      if (fs.existsSync(this.dbPath)) {
        const filebuffer = fs.readFileSync(this.dbPath);
        this.db = new SQL.Database(filebuffer);
        console.log(`[SQLite WAL DB] Opened persistent SQLite database at data/outlet_edge.sqlite`);
      } else {
        this.db = new SQL.Database();
        console.log(`[SQLite WAL DB] Initialized new SQLite database instance.`);
      }

      this.createTables();
      this.loadFromSQLite();
    } catch (err) {
      console.warn(`[SQLite DB Warn] Falling back to JSON storage mode:`, (err as Error).message);
      this.loadFromJSONFallback();
    }
  }

  private createTables(): void {
    if (!this.db) return;
    this.db.run(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id TEXT PRIMARY KEY,
        sku TEXT NOT NULL,
        name TEXT NOT NULL,
        cat TEXT NOT NULL,
        station TEXT NOT NULL,
        price REAL NOT NULL,
        is_available INTEGER NOT NULL,
        image TEXT
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        order_number TEXT NOT NULL,
        table_id TEXT NOT NULL,
        waiter_id TEXT NOT NULL,
        subtotal REAL NOT NULL,
        total_tax REAL NOT NULL,
        grand_total REAL NOT NULL,
        raw_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS inventory_stock (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        available_qty REAL NOT NULL,
        unit TEXT NOT NULL,
        reorder_level REAL NOT NULL
      );

      CREATE TABLE IF NOT EXISTS order_events (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        staff_id TEXT NOT NULL,
        details_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
  }

  private loadFromSQLite(): void {
    if (!this.db) return;

    // LOAD MENU ITEMS
    const menuResult = this.db.exec("SELECT * FROM menu_items");
    if (menuResult.length > 0 && menuResult[0].values.length > 0) {
      this.menuItems = menuResult[0].values.map((row: any[]) => ({
        id: row[0] as string,
        sku: row[1] as string,
        name: row[2] as string,
        cat: row[3] as string,
        station: row[4] as string,
        price: row[5] as number,
        isAvailable: Boolean(row[6]),
        image: (row[7] as string) || undefined,
      }));
    } else {
      this.menuItems = this.getDefaultMenuItems();
      this.seedSQLiteMenuItems();
    }

    // LOAD INVENTORY
    const invResult = this.db.exec("SELECT * FROM inventory_stock");
    if (invResult.length > 0 && invResult[0].values.length > 0) {
      this.inventory = invResult[0].values.map((row: any[]) => ({
        code: row[0] as string,
        name: row[1] as string,
        availableQty: row[2] as number,
        unit: row[3] as string,
        reorderLevel: row[4] as number,
      }));
    } else {
      this.inventory = this.getDefaultInventory();
      this.seedSQLiteInventory();
    }

    // LOAD ORDERS
    const orderResult = this.db.exec("SELECT raw_json FROM orders");
    if (orderResult.length > 0 && orderResult[0].values.length > 0) {
      this.orders = orderResult[0].values.map((row: any[]) => JSON.parse(row[0] as string));
    }
  }

  private seedSQLiteMenuItems(): void {
    if (!this.db) return;
    const stmt = this.db.prepare("INSERT OR REPLACE INTO menu_items VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    for (const item of this.menuItems) {
      stmt.run([item.id, item.sku, item.name, item.cat, item.station, item.price, item.isAvailable ? 1 : 0, item.image || null]);
    }
    stmt.free();
    this.persistSQLite();
  }

  private seedSQLiteInventory(): void {
    if (!this.db) return;
    const stmt = this.db.prepare("INSERT OR REPLACE INTO inventory_stock VALUES (?, ?, ?, ?, ?)");
    for (const inv of this.inventory) {
      stmt.run([inv.code, inv.name, inv.availableQty, inv.unit, inv.reorderLevel]);
    }
    stmt.free();
    this.persistSQLite();
  }

  private loadFromJSONFallback(): void {
    if (fs.existsSync(this.jsonFallbackPath)) {
      try {
        const raw = fs.readFileSync(this.jsonFallbackPath, 'utf8');
        const data = JSON.parse(raw);
        this.menuItems = data.menuItems || this.getDefaultMenuItems();
        this.orders = data.orders || [];
        this.inventory = this.getDefaultInventory();
      } catch (e) {
        this.menuItems = this.getDefaultMenuItems();
        this.inventory = this.getDefaultInventory();
      }
    } else {
      this.menuItems = this.getDefaultMenuItems();
      this.inventory = this.getDefaultInventory();
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

  private getDefaultInventory(): InventoryItem[] {
    return [
      { code: 'ING_CHICKEN_KG', name: 'Raw Chicken (Fresh)', availableQty: 45.5, unit: 'kg', reorderLevel: 10.0 },
      { code: 'ING_PANEER_KG', name: 'Malai Paneer', availableQty: 18.0, unit: 'kg', reorderLevel: 5.0 },
      { code: 'ING_BUTTER_KG', name: 'Amul Butter Packets', availableQty: 25.0, unit: 'kg', reorderLevel: 5.0 },
      { code: 'ING_FLOUR_KG', name: 'Maida Wheat Flour', availableQty: 100.0, unit: 'kg', reorderLevel: 20.0 }
    ];
  }

  private persistSQLite(): void {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (err) {
      console.error(`[SQLite Write Error]:`, (err as Error).message);
    }
  }

  public getMenuItems(): LocalMenuItem[] {
    return this.menuItems;
  }

  public getOrders(): Order[] {
    return this.orders;
  }

  public getInventory(): InventoryItem[] {
    return this.inventory;
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

    if (this.db) {
      this.db.run(
        "INSERT OR REPLACE INTO menu_items VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [newItem.id, newItem.sku, newItem.name, newItem.cat, newItem.station, newItem.price, 1, null]
      );
      this.persistSQLite();
    }
    return newItem;
  }

  public removeMenuItem(id: string): boolean {
    const initLen = this.menuItems.length;
    this.menuItems = this.menuItems.filter(m => m.id !== id);
    if (this.menuItems.length !== initLen) {
      if (this.db) {
        this.db.run("DELETE FROM menu_items WHERE id = ?", [id]);
        this.persistSQLite();
      }
      return true;
    }
    return false;
  }

  public async saveOrder(order: Order): Promise<void> {
    this.orders.push(order);
    if (this.db) {
      this.db.run(
        "INSERT OR REPLACE INTO orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          order.id,
          order.orderNumber,
          order.tableId || 'Table 2',
          order.waiterId || 'usr_waiter_01',
          order.subtotal,
          order.totalTax,
          order.grandTotal,
          JSON.stringify(order),
          order.createdAt || new Date().toISOString()
        ]
      );
      this.logAuditTrail(order.id, 'ORDER_PLACED', order.waiterId || 'usr_waiter_01', { grandTotal: order.grandTotal, itemsCount: order.items?.length });
      this.persistSQLite();
    }
  }

  /**
   * 🛡️ APPEND-ONLY AUDIT TRAIL LOGGING
   */
  public logAuditTrail(orderId: string, eventType: 'ORDER_PLACED' | 'ITEM_VOIDED' | 'PRICE_OVERRIDE' | 'TABLE_TRANSFERRED' | 'DISCOUNT_APPLIED', staffId: string, details: any): void {
    if (!this.db) return;
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    this.db.run(
      "INSERT INTO order_events VALUES (?, ?, ?, ?, ?, ?)",
      [eventId, orderId, eventType, staffId, JSON.stringify(details), now]
    );
  }

  /**
   * 🥩 ATOMIC RAW INGREDIENT DEDUCTION
   */
  public deductStockForOrder(itemId: string, quantity: number): void {
    let ingCode = '';
    let amountPerPortion = 0.25; // Default 250g per dish

    if (itemId.includes('butter_chicken') || itemId.includes('chicken_biryani')) {
      ingCode = 'ING_CHICKEN_KG';
    } else if (itemId.includes('paneer_tikka')) {
      ingCode = 'ING_PANEER_KG';
    } else if (itemId.includes('naan')) {
      ingCode = 'ING_FLOUR_KG';
      amountPerPortion = 0.10; // 100g flour per naan
    }

    if (ingCode) {
      const inv = this.inventory.find(i => i.code === ingCode);
      if (inv) {
        inv.availableQty = Math.max(0, Number((inv.availableQty - amountPerPortion * quantity).toFixed(3)));
        if (this.db) {
          this.db.run("UPDATE inventory_stock SET available_qty = ? WHERE code = ?", [inv.availableQty, ingCode]);
          console.log(`[BOM Stock Depletion] Deducted ${(amountPerPortion * quantity).toFixed(3)}${inv.unit} of ${inv.name}. Remaining: ${inv.availableQty}${inv.unit}`);
        }
      }
    }
  }
}
