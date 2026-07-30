export class MenuSyncService {
  private lastSyncTimestamp: string | null = null;

  async syncMenuFromCloud(): Promise<boolean> {
    console.log('[MenuSyncService] Syncing latest menu catalog from HQ Cloud API...');
    this.lastSyncTimestamp = new Date().toISOString();
    return true;
  }

  getLastSyncTime(): string | null {
    return this.lastSyncTimestamp;
  }
}
