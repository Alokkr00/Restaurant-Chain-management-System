import { User } from '../../../../apps/cloud-api/src/modules/user/user.service';

export interface PinAuthResult {
  success: boolean;
  user?: User;
  latencyMs: number;
  message: string;
}

export class AuthPinService {
  private localUserPinCache: Map<string, User> = new Map();

  /**
   * Syncs user PIN hashes from Cloud API to local Edge Node cache.
   */
  async syncUserPinsFromCloud(users: User[]): Promise<void> {
    console.log('[AuthPin] Caching user PIN hashes locally on Edge Node...');
    this.localUserPinCache.clear();
    for (const user of users) {
      if (user.isActive) {
        this.localUserPinCache.set(user.pinHash, user);
      }
    }
    console.log(`[AuthPin] Cached ${this.localUserPinCache.size} active staff PIN profiles locally.`);
  }

  /**
   * Fast offline 4-digit PIN verification (<300ms SLA).
   */
  authenticatePinLocally(pin: string): PinAuthResult {
    const startTime = performance.now();
    const user = this.localUserPinCache.get(pin);
    const latencyMs = Number((performance.now() - startTime).toFixed(2));

    if (user) {
      return {
        success: true,
        user,
        latencyMs,
        message: `Authenticated as ${user.name} (${user.role}) in ${latencyMs}ms`,
      };
    }

    return {
      success: false,
      latencyMs,
      message: `Invalid PIN provided. Authentication failed (${latencyMs}ms).`,
    };
  }
}
