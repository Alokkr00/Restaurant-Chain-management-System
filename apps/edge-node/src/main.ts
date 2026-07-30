import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { calculateGST } from '@rcms/gst-engine';
import { Order, OrderType, OrderStatus } from '@rcms/shared-types';
import { LocalDatabaseService } from './database/local-db.service';
import { InventoryService } from './modules/inventory/inventory.service';

const dbService = new LocalDatabaseService();
const inventoryService = new InventoryService();

let liveOrders: Order[] = [];
let liveKdsTickets: any[] = [];

const ROOT_DIR = path.resolve(__dirname, '../../../..');

function serveStaticFile(res: http.ServerResponse, filePath: string, contentType: string) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
}

async function startServer() {
  await dbService.initialize();

  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = req.url || '';

    // ==========================================
    // 🌐 FRONTEND STATIC ROUTING
    // ==========================================
    if (url === '/' || url === '/pos' || url === '/pos/' || url === '/pos/index.html') {
      serveStaticFile(res, path.join(ROOT_DIR, 'apps/pos-waiter/index.html'), 'text/html');
      return;
    }
    if (url === '/pos/styles.css') {
      serveStaticFile(res, path.join(ROOT_DIR, 'apps/pos-waiter/styles.css'), 'text/css');
      return;
    }
    if (url === '/pos/app.js') {
      serveStaticFile(res, path.join(ROOT_DIR, 'apps/pos-waiter/app.js'), 'application/javascript');
      return;
    }

    if (url === '/kds' || url === '/kds/' || url === '/kds/index.html') {
      serveStaticFile(res, path.join(ROOT_DIR, 'apps/kds/index.html'), 'text/html');
      return;
    }
    if (url === '/kds/styles.css') {
      serveStaticFile(res, path.join(ROOT_DIR, 'apps/kds/styles.css'), 'text/css');
      return;
    }
    if (url === '/kds/app.js') {
      serveStaticFile(res, path.join(ROOT_DIR, 'apps/kds/app.js'), 'application/javascript');
      return;
    }

    if (url === '/hq' || url === '/hq/' || url === '/hq/index.html') {
      serveStaticFile(res, path.join(ROOT_DIR, 'apps/hq-portal/index.html'), 'text/html');
      return;
    }
    if (url === '/hq/styles.css') {
      serveStaticFile(res, path.join(ROOT_DIR, 'apps/hq-portal/styles.css'), 'text/css');
      return;
    }

    // ==========================================
    // 📡 REST API: MENU CRUD (GET, POST, DELETE)
    // ==========================================
    if (req.method === 'GET' && url === '/api/v1/menu') {
      const items = dbService.getMenuItems();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, items }));
      return;
    }

    if (req.method === 'POST' && url === '/api/v1/menu') {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        try {
          const { name, cat, price, station } = JSON.parse(body);
          if (!name || !price || !cat || !station) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Missing required fields' }));
            return;
          }

          const newItem = dbService.addMenuItem({ name, cat, price: Number(price), station });
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, item: newItem }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: (err as Error).message }));
        }
      });
      return;
    }

    if (req.method === 'DELETE' && url.startsWith('/api/v1/menu/')) {
      const itemId = url.split('/api/v1/menu/')[1];
      const removed = dbService.removeMenuItem(itemId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: removed }));
      return;
    }

    // ==========================================
    // 📡 REST API: KDS & ORDERS
    // ==========================================
    if (req.method === 'GET' && url.startsWith('/api/v1/kds/tickets')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, tickets: liveKdsTickets }));
      return;
    }

    if (req.method === 'POST' && url === '/api/v1/orders') {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body);
          const orderNum = `KOT-${Math.floor(1000 + Math.random() * 9000)}`;

          // SERVER-SIDE PRICE & GST VALIDATION
          const dbMenu = dbService.getMenuItems();
          let serverSubtotal = 0;
          const validatedItems = (payload.items || []).map((item: any) => {
            const dbItem = dbMenu.find((m) => m.id === item.menuItemId);
            const verifiedPrice = dbItem ? dbItem.price : item.unitPrice;
            const lineSubtotal = verifiedPrice * item.quantity;
            serverSubtotal += lineSubtotal;

            return {
              id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              menuItemId: item.menuItemId,
              itemName: item.itemName,
              quantity: item.quantity,
              unitPrice: verifiedPrice,
              subtotal: lineSubtotal,
              station: item.station || 'GRILL',
              kdsStatus: 'PENDING', // Item-level status tracking
              notes: item.notes || '',
            };
          });

          const tax = calculateGST(serverSubtotal);
          const serverGrandTotal = Number((serverSubtotal + tax.totalTax).toFixed(2));

          const newOrder: Order = {
            id: `ord_${Date.now()}`,
            outletId: 'outlet_flagship_01',
            orderNumber: orderNum,
            tableId: payload.tableId || 'Table 2',
            waiterId: payload.waiterId || 'usr_waiter_01',
            orderType: OrderType.DINE_IN,
            status: OrderStatus.PLACED,
            items: validatedItems,
            subtotal: serverSubtotal,
            totalTax: tax.totalTax,
            discountAmount: 0,
            grandTotal: serverGrandTotal,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await dbService.saveOrder(newOrder);
          liveOrders.push(newOrder);

          for (const item of newOrder.items) {
            inventoryService.processOrderStockDepletion(item.menuItemId, item.quantity);
          }

          // Item-level KDS ticket tracking
          liveKdsTickets.push({
            id: newOrder.id,
            orderNumber: newOrder.orderNumber,
            table: newOrder.tableId,
            placedMinutesAgo: 0,
            items: validatedItems,
          });

          console.log(`[Edge Node HTTP] Order #${orderNum} created. Server Subtotal: ₹${serverSubtotal}, Tax: ₹${tax.totalTax}, Grand Total: ₹${serverGrandTotal}`);

          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, order: newOrder }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: (err as Error).message }));
        }
      });
      return;
    }

    // ITEM-LEVEL KDS BUMPING (Prevents Grill bump from clearing Bar items)
    if (req.method === 'POST' && url === '/api/v1/kds/bump') {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        try {
          const { itemId } = JSON.parse(body);
          let itemFound = false;

          for (const ticket of liveKdsTickets) {
            const item = ticket.items.find((i: any) => i.id === itemId);
            if (item) {
              if (item.kdsStatus === 'PENDING') item.kdsStatus = 'COOKING';
              else if (item.kdsStatus === 'COOKING') item.kdsStatus = 'BUMPED';
              itemFound = true;
              console.log(`[Edge Node HTTP] Item-level KDS bump: "${item.itemName}" on #${ticket.orderNumber} is now ${item.kdsStatus}`);
              break;
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: itemFound }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: (err as Error).message }));
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  });

  const PORT = 3001;
  server.listen(PORT, () => {
    console.log(`\n====================================================`);
    console.log(`🚀 RCMS FULL-STACK SYSTEM LIVE ON PORT ${PORT}`);
    console.log(`====================================================`);
    console.log(`📱 POS Waiter PWA UI:       http://localhost:${PORT}/pos`);
    console.log(`📺 Kitchen Display (KDS):   http://localhost:${PORT}/kds`);
    console.log(`📊 Cloud HQ Dashboard:     http://localhost:${PORT}/hq`);
    console.log(`====================================================\n`);
  });
}

startServer().catch((err) => console.error('[Edge Node] Start error:', err));
