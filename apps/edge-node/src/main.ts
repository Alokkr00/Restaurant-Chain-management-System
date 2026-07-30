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

// Root workspace directory (e:\Books)
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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
    // 📡 REST API ENDPOINTS
    // ==========================================
    if (req.method === 'GET' && url === '/api/v1/menu') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          items: [
            { id: 'item_butter_chicken', cat: 'cat_mains', name: 'Butter Chicken', price: 350, station: 'GRILL' },
            { id: 'item_paneer_tikka', cat: 'cat_starters', name: 'Paneer Tikka', price: 280, station: 'GRILL' },
            { id: 'item_dal_makhani', cat: 'cat_mains', name: 'Dal Makhani', price: 260, station: 'FRY' },
            { id: 'item_butter_naan', cat: 'cat_mains', name: 'Butter Naan', price: 60, station: 'GRILL' },
            { id: 'item_masala_coke', cat: 'cat_beverages', name: 'Masala Coke', price: 90, station: 'BAR' },
            { id: 'item_sweet_lassi', cat: 'cat_beverages', name: 'Sweet Lassi', price: 110, station: 'BAR' },
          ],
        }),
      );
      return;
    }

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
          const tax = calculateGST(payload.subtotal || 700);

          const newOrder: Order = {
            id: `ord_${Date.now()}`,
            outletId: 'outlet_flagship_01',
            orderNumber: orderNum,
            tableId: payload.tableId || 'Table 2',
            waiterId: payload.waiterId || 'usr_waiter_01',
            orderType: OrderType.DINE_IN,
            status: OrderStatus.PLACED,
            items: payload.items || [],
            subtotal: payload.subtotal,
            totalTax: tax.totalTax,
            discountAmount: 0,
            grandTotal: payload.grandTotal,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await dbService.saveOrder(newOrder);
          liveOrders.push(newOrder);

          for (const item of newOrder.items) {
            inventoryService.processOrderStockDepletion(item.menuItemId, item.quantity);
          }

          liveKdsTickets.push({
            id: newOrder.id,
            orderNumber: newOrder.orderNumber,
            table: newOrder.tableId,
            placedMinutesAgo: 0,
            items: newOrder.items.map((i: any) => ({
              name: i.itemName,
              qty: i.quantity,
              station: i.station || 'GRILL',
              notes: i.notes || '',
            })),
            status: 'PENDING',
          });

          console.log(`[Edge Node HTTP] Order #${orderNum} created. Pushed to KDS. GST Tax: ₹${tax.totalTax}`);

          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, order: newOrder }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: (err as Error).message }));
        }
      });
      return;
    }

    if (req.method === 'POST' && url === '/api/v1/kds/bump') {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        try {
          const { ticketId } = JSON.parse(body);
          const ticket = liveKdsTickets.find((t) => t.id === ticketId);
          if (ticket) {
            if (ticket.status === 'PENDING') ticket.status = 'COOKING';
            else if (ticket.status === 'COOKING') ticket.status = 'BUMPED';
            console.log(`[Edge Node HTTP] KDS Ticket #${ticket.orderNumber} status changed to ${ticket.status}`);
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, ticket }));
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
    console.log(`🚀 RCMS FULL-STACK SYSTEM IS LIVE & LISTENING!`);
    console.log(`====================================================`);
    console.log(`📱 POS Waiter PWA UI:       http://localhost:${PORT}/pos`);
    console.log(`📺 Kitchen Display (KDS):   http://localhost:${PORT}/kds`);
    console.log(`📊 Cloud HQ Dashboard:     http://localhost:${PORT}/hq`);
    console.log(`📡 Backend REST API:        http://localhost:${PORT}/api/v1/menu`);
    console.log(`====================================================\n`);
  });
}

startServer().catch((err) => console.error('[Edge Node] Start error:', err));
