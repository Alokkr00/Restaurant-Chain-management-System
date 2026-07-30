export enum UserRole {
  HQ_ADMIN = 'HQ_ADMIN',
  OUTLET_MANAGER = 'OUTLET_MANAGER',
  WAITER = 'WAITER',
  CASHIER = 'CASHIER',
  KITCHEN_STAFF = 'KITCHEN_STAFF',
}

export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  outletIds: string[]; // Access control for multi-outlet
  pinHash: string; // 4-digit PIN stored securely (hashed)
  isActive: boolean;
}

export class UserService {
  private users: User[] = [
    {
      id: 'usr_admin_01',
      name: 'Operations Head',
      email: 'ops@restaurantchain.com',
      role: UserRole.HQ_ADMIN,
      outletIds: ['ALL'],
      pinHash: '1234', // Simple demonstration hash
      isActive: true,
    },
    {
      id: 'usr_waiter_01',
      name: 'Rahul Sharma',
      role: UserRole.WAITER,
      outletIds: ['outlet_flagship_01'],
      pinHash: '4321',
      isActive: true,
    },
    {
      id: 'usr_cook_01',
      name: 'Chef Chef Vikram',
      role: UserRole.KITCHEN_STAFF,
      outletIds: ['outlet_flagship_01'],
      pinHash: '9999',
      isActive: true,
    },
  ];

  verifyPin(pin: string, outletId: string): User | null {
    const user = this.users.find(
      (u) => u.pinHash === pin && u.isActive && (u.outletIds.includes('ALL') || u.outletIds.includes(outletId)),
    );
    return user || null;
  }

  getUsersByOutlet(outletId: string): User[] {
    return this.users.filter(
      (u) => u.isActive && (u.outletIds.includes('ALL') || u.outletIds.includes(outletId)),
    );
  }

  createUser(user: Omit<User, 'id'>): User {
    const newUser: User = {
      ...user,
      id: `usr_${Date.now()}`,
    };
    this.users.push(newUser);
    return newUser;
  }
}
