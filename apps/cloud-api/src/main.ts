import { MenuService } from './modules/menu/menu.service';
import { UserService } from './modules/user/user.service';
import { HQReportingService } from './modules/reporting/hq-reporting.service';

console.log('----------------------------------------------------');
console.log('☁️  RCMS AWS Cloud API Gateway Scaffolding');
console.log('----------------------------------------------------');

const menuService = new MenuService();
const userService = new UserService();
const hqReportingService = new HQReportingService();

const categories = menuService.getCategories();
const menuItems = menuService.getMenuItems();
const flagshipUsers = userService.getUsersByOutlet('outlet_flagship_01');

console.log(`[CloudAPI] Initialized Menu Categories (${categories.length}):`, categories.map((c) => c.name));
console.log(`[CloudAPI] Initialized Menu Items (${menuItems.length}):`, menuItems.map((m) => `${m.name} (₹${m.basePrice})`));
console.log(`[CloudAPI] Flagship Outlet Staff Active (${flagshipUsers.length}):`, flagshipUsers.map((u) => `${u.name} [${u.role}]`));

const summary = hqReportingService.getMultiOutletSummary();
console.log(`[CloudAPI] HQ Summary Aggregator initialized. Total outlets tracked: ${summary.outlets.length}`);
