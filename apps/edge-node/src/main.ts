import { calculateGST } from '@rcms/gst-engine';
import { Order, OrderType, OrderStatus } from '@rcms/shared-types';
import { LocalDatabaseService } from './database/local-db.service';
import { InventoryService } from './modules/inventory/inventory.service';

async function bootstrap() {
  const dbService = new LocalDatabaseService();
  const inventoryService = new InventoryService();

  await dbService.initialize();

  const order: Order = {
    id: 'ord_1001',
    outletId: 'outlet_flagship_01',
    orderNumber: 'KOT-1001',
    tableId: 'Table 2',
    waiterId: 'usr_waiter_01',
    orderType: OrderType.DINE_IN,
    status: OrderStatus.PLACED,
    items: [
      {
        id: 'item_1',
        orderId: 'ord_1001',
        menuItemId: 'item_butter_chicken',
        itemName: 'Butter Chicken',
        unitPrice: 350,
        quantity: 2,
        subtotal: 700,
        taxBreakdown: calculateGST(700),
        totalPrice: 735,
        station: 'GRILL' as any,
        kdsStatus: 'PENDING' as any,
      },
    ],
    subtotal: 700,
    totalTax: 35,
    discountAmount: 0,
    grandTotal: 735,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await dbService.saveOrder(order);
  inventoryService.processOrderStockDepletion('item_butter_chicken', 2);
  const pendingEvents = await dbService.getPendingSyncEvents();

  console.log(`[Edge Node] Local Edge Server initialized. Order #${order.orderNumber} created. Pending sync queue: ${pendingEvents.length} events.`);
}

bootstrap().catch((err) => {
  console.error('[Edge Node] Boot error:', err);
  process.exit(1);
});
