import * as net from 'net';

export interface ThermalPrintJob {
  jobId: string;
  targetPrinterIp: string;
  targetPrinterPort?: number;
  fallbackPrinterIp?: string;
  rawEscPosBuffer: Buffer;
}

export class ESCPOSPrintAgent {
  async sendPrintJob(job: ThermalPrintJob): Promise<boolean> {
    const port = job.targetPrinterPort || 9100;
    console.log(`[PrintAgent] Dispatching ESC/POS print job ${job.jobId} to ${job.targetPrinterIp}:${port}`);

    try {
      await this.writeToSocket(job.targetPrinterIp, port, job.rawEscPosBuffer);
      console.log(`[PrintAgent] Print job ${job.jobId} completed successfully.`);
      return true;
    } catch (err) {
      console.error(`[PrintAgent] Connection error on ${job.targetPrinterIp}:${port}: ${(err as Error).message}`);
      if (job.fallbackPrinterIp) {
        console.log(`[PrintAgent] Attempting failover to backup printer ${job.fallbackPrinterIp}:${port}`);
        try {
          await this.writeToSocket(job.fallbackPrinterIp, port, job.rawEscPosBuffer);
          console.log(`[PrintAgent] Print job ${job.jobId} completed on backup printer.`);
          return true;
        } catch (backupErr) {
          console.error(`[PrintAgent] Backup printer failover failed: ${(backupErr as Error).message}`);
        }
      }
      return false;
    }
  }

  private writeToSocket(host: string, port: number, data: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      client.setTimeout(3000);

      const cleanup = () => {
        client.removeAllListeners();
        client.destroy();
      };

      client.connect(port, host, () => {
        client.write(data, () => {
          client.end();
          cleanup();
          resolve();
        });
      });

      client.on('error', (err) => {
        cleanup();
        reject(err);
      });

      client.on('timeout', () => {
        cleanup();
        reject(new Error(`TCP Socket connection timeout to ${host}:${port}`));
      });
    });
  }
}
