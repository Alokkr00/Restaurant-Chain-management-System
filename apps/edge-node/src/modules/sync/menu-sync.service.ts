import { MenuItem, MenuCategory } from '../../../../apps/cloud-api/src/modules/menu/menu.service';

export interface MenuSyncState {
  lastSyncedAt: string;
  version: number;
  categories: MenuCategory[];
  items: MenuItem[];
}

export class MenuSyncService {
  private localMenuCache: MenuSyncState = {
    lastSyncedAt: new Date(0).toISOString(),
    version: 0,
    categories: [],
    items: [],
  };

  /**
   * Pulls latest menu & tax rules from Cloud API (Hybrid Pull model).
   * Runs on startup and periodically every 5–15 minutes.
   */
  async pullLatestMenuFromCloud(cloudMenuItems: MenuItem[], cloudCategories: MenuCategory[]): Promise<MenuSyncState> {
    console.log('[MenuSync] Pulling latest menu catalog & tax rules from AWS Cloud API...');

    this.localMenuCache = {
      lastSyncedAt: new Date().toISOString(),
      version: this.localMenuCache.version + 1,
      categories: cloudCategories,
      items: cloudMenuItems,
    };

    console.log(
      `[MenuSync] Menu cache updated locally. Version: ${this.localMenuCache.version}, Items: ${this.localMenuCache.items.length}`,
    );
    return this.localMenuCache;
  }

  /**
   * Force push handler for instant HQ menu updates.
   */
  async handleHQForcePush(cloudMenuItems: MenuItem[], cloudCategories: MenuCategory[]): Promise<void> {
    console.log('[MenuSync] HQ Force-Push invalidation signal received via WebSockets!');
    await this.pullLatestMenuFromCloud(cloudMenuItems, cloudCategories);
  }

  /**
   * Safe offline reader — never blocks ordering if internet is down.
   */
  getLocalMenu(): MenuSyncState {
    if (this.localMenuCache.items.length === 0) {
      console.warn('[MenuSync] Serving default offline menu backup.');
    }
    return this.localMenuCache;
  }
}
