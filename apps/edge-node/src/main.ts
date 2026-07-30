import { calculateGST } from '@rcms/gst-engine';
import { Order, OrderType, OrderStatus } from '@rcms/shared-types';
import { LocalDatabaseService } from './database/local-db.service';
import { InventoryService } from './modules/inventory/inventory.service';

async function bootstrapEdgeNode() {
  console.log('----------------------------------------------------');
  console.log('🚀 RCMS Local Edge Node (Outlet Master) Scaffolding');
  console.log('----------------------------------------------------');

  const dbService = new LocalDatabaseService();
  const inventoryService = new InventoryService();

  await dbService.initialize();

  const sampleOrder: Order = {
    id: 'ord_edge_1001',
    outletId: 'outlet_flagship_01',
    orderNumber: 'KOT-1001',
    tableId: 'Table 4',
    waiterId: 'waiter_04',
    orderType: OrderType.DINE_IN,
    status: OrderStatus.PLACED,
    items: [
      {
        id: 'item_1',
        orderId: 'ord_edge_1001',
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

  await dbService.saveOrder(sampleOrder);
  console.log(`[EdgeNode] Order ${sampleOrder.orderNumber} initialized in local state.`);

  const depletions = inventoryService.processOrderStockDepletion('item_butter_chicken', 2);
  console.log(`[EdgeNode] BOM Depletion calculation executed for 2x Butter Chicken.`);

  const pendingEvents = await dbService.getPendingSyncEvents();
  console.log(`[EdgeNode] Event log queue ready. Pending sync items: ${pendingEvents.length}`);
}

bootstrapEdgeNode().catch((err) => console.error('Edge Node bootstrap error:', err));
