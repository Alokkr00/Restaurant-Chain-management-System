import { ESCPOSBuilder } from './escpos-builder';
import { ESCPOSPrintAgent } from './main';

export interface StationPrinterMap {
  station: 'GRILL' | 'FRY' | 'COLD' | 'BAR';
  printerIp: string;
  printerPort: number;
}

export class MultiStationPrinterRouter {
  private printAgent = new ESCPOSPrintAgent();
  private stationPrinters: Map<string, StationPrinterMap> = new Map();

  constructor() {
    // Default Station IP Mappings
    this.stationPrinters.set('GRILL', { station: 'GRILL', printerIp: '192.168.1.101', printerPort: 9100 });
    this.stationPrinters.set('FRY', { station: 'FRY', printerIp: '192.168.1.102', printerPort: 9100 });
    this.stationPrinters.set('COLD', { station: 'COLD', printerIp: '192.168.1.103', printerPort: 9100 });
    this.stationPrinters.set('BAR', { station: 'BAR', printerIp: '192.168.1.104', printerPort: 9100 });
  }

  /**
   * BUILD AND ROUTE STATION-SPECIFIC KITCHEN KOT TICKET
   */
  public buildStationKOTBuffer(orderNumber: string, tableId: string, stationName: string, items: Array<{ itemName: string; quantity: number; notes?: string }>): Buffer {
    const builder = new ESCPOSBuilder();

    builder
      .initialize()
      .setAlign('center')
      .setBold(true)
      .setTextSize(2, 2)
      .textLine(`*** ${stationName} KOT ***`)
      .setTextSize(1, 1)
      .setBold(false)
      .separator('=')
      .setAlign('left')
      .row2Column(`Order #: ${orderNumber}`, `Table: ${tableId}`)
      .row2Column(`Time: ${new Date().toLocaleTimeString()}`, `Station: ${stationName}`)
      .separator('-');

    for (const item of items) {
      builder.textLine(`${item.quantity}x  ${item.itemName}`);
      if (item.notes) {
        builder.textLine(`    --> Note: ${item.notes}`);
      }
    }

    builder
      .separator('=')
      .feed(3)
      .cut();

    return builder.build();
  }

  /**
   * ROUTE ORDER ITEMS TO RESPECTIVE HARDWARE STATION PRINTERS
   */
  public async routeKOTPrintJobs(orderNumber: string, tableId: string, items: Array<{ itemName: string; quantity: number; station: string; notes?: string }>): Promise<void> {
    const itemsByStation = new Map<string, Array<{ itemName: string; quantity: number; notes?: string }>>();

    for (const item of items) {
      const st = item.station || 'GRILL';
      const list = itemsByStation.get(st) || [];
      list.push(item);
      itemsByStation.set(st, list);
    }

    for (const [station, stItems] of itemsByStation.entries()) {
      const config = this.stationPrinters.get(station) || { station: station as any, printerIp: '127.0.0.1', printerPort: 9100 };
      const rawBuffer = this.buildStationKOTBuffer(orderNumber, tableId, station, stItems);

      console.log(`[Printer Router] Dispatching ${stItems.length} items for Station "${station}" to Printer IP ${config.printerIp}:${config.printerPort}`);
      
      // Attempt sending to LAN Printer (non-blocking)
      this.printAgent.sendPrintJob({
        jobId: `job_${Date.now()}_${station}`,
        targetPrinterIp: config.printerIp,
        targetPrinterPort: config.printerPort,
        rawEscPosBuffer: rawBuffer
      }).catch(err => console.warn(`[Printer Router Warning] Station ${station} printer offline:`, err.message));
    }
  }
}
