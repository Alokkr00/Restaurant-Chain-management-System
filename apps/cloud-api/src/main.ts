import { MenuService } from './modules/menu/menu.service';
import { UserService } from './modules/user/user.service';
import { HQReportingService } from './modules/reporting/hq-reporting.service';

async function bootstrap() {
  const menuService = new MenuService();
  const userService = new UserService();
  const hqReportingService = new HQReportingService();

  const categories = menuService.getCategories();
  const menuItems = menuService.getMenuItems();
  const users = userService.getUsersByOutlet('outlet_flagship_01');
  const summary = hqReportingService.getMultiOutletSummary();

  console.log(`[Cloud API] Server running. Outlets: ${summary.outlets.length}, Menu Items: ${menuItems.length}, Categories: ${categories.length}, Active Users: ${users.length}`);
}

bootstrap().catch((err) => {
  console.error('[Cloud API] Boot error:', err);
  process.exit(1);
});
