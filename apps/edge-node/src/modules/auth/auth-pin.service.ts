export interface PinSession {
  userId: string;
  userName: string;
  role: string;
  authenticatedAt: string;
}

export class AuthPinService {
  private pinCache: Map<string, { userId: string; userName: string; role: string }> = new Map();

  constructor() {
    this.pinCache.set('4321', { userId: 'usr_waiter_01', userName: 'Rahul Sharma', role: 'WAITER' });
    this.pinCache.set('1234', { userId: 'usr_mgr_01', userName: 'Outlet Manager', role: 'ADMIN' });
  }

  authenticatePin(pin: string): PinSession | null {
    const user = this.pinCache.get(pin);
    if (!user) return null;

    return {
      userId: user.userId,
      userName: user.userName,
      role: user.role,
      authenticatedAt: new Date().toISOString(),
    };
  }
}
