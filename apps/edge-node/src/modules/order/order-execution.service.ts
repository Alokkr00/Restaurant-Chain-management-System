import { Order } from '@rcms/shared-types';
import { ESCPOSPrintAgent } from '@rcms/print-agent';

export class OrderExecutionService {
  private printAgent = new ESCPOSPrintAgent();

  async processOrder(order: Order): Promise<boolean> {
    console.log(`[OrderExecution] Processing order ${order.orderNumber} for table ${order.tableId}...`);
    
    // Dispatch print job
    const printBuffer = Buffer.from(`KOT ORDER #${order.orderNumber}\nTABLE: ${order.tableId}\nITEMS: ${order.items.length}\n`);
    await this.printAgent.sendPrintJob({
      jobId: `print_${Date.now()}`,
      targetPrinterIp: '192.168.1.200',
      rawEscPosBuffer: printBuffer,
    });

    return true;
  }
}
