import { Order, KitchenStation } from '../../../../packages/shared-types/src/index';
import { LocalDatabaseService } from '../../database/local-db.service';
import { KOTFormatterService, FormattedKOTPrintJob } from '../print/kot-formatter.service';
import { ESCPOSPrintAgent } from '../../../../services/print-agent/src/main';

export class OrderExecutionService {
  constructor(
    private dbService: LocalDatabaseService,
    private kotFormatter: KOTFormatterService,
    private printAgent: ESCPOSPrintAgent,
  ) {}

  async processIncomingOrder(order: Order): Promise<{ success: boolean; printJobs: FormattedKOTPrintJob[] }> {
    console.log(`[OrderExecution] Received order ${order.orderNumber} over LAN WebSockets.`);

    // 1. Save order to local SQLite DB & queue event for cloud sync
    await this.dbService.saveOrder(order);

    // 2. Format KOT print jobs per station (GRILL, FRY, COLD, BAR)
    const stations: KitchenStation[] = ['GRILL', 'FRY', 'COLD', 'BAR'] as any;
    const generatedJobs: FormattedKOTPrintJob[] = [];

    for (const station of stations) {
      const printJob = this.kotFormatter.formatKOTForStation(order, station);
      if (printJob) {
        generatedJobs.push(printJob);
        console.log(`[OrderExecution] Formatted KOT for ${station} station -> Primary Printer: ${printJob.targetPrinterIp}`);

        // 3. Dispatch to silent ESC/POS Print Agent with auto-failover
        await this.printAgent.sendPrintJob({
          jobId: printJob.jobId,
          targetPrinterIp: printJob.targetPrinterIp,
          targetPrinterPort: 9100,
          fallbackPrinterIp: printJob.fallbackPrinterIp,
          rawEscPosBuffer: Buffer.from(printJob.formattedText),
        });
      }
    }

    return {
      success: true,
      printJobs: generatedJobs,
    };
  }
}
