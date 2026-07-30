export interface MenuCategory {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

export interface MenuItemModifier {
  id: string;
  name: string;
  priceDelta: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  basePrice: number;
  station: 'GRILL' | 'FRY' | 'COLD' | 'BAR';
  taxRate: number; // e.g., 5 for 5% GST
  isActive: boolean;
  modifiers: MenuItemModifier[];
}

export class MenuService {
  private categories: MenuCategory[] = [
    { id: 'cat_starters', name: 'Starters', displayOrder: 1, isActive: true },
    { id: 'cat_mains', name: 'Main Course', displayOrder: 2, isActive: true },
    { id: 'cat_beverages', name: 'Beverages', displayOrder: 3, isActive: true },
  ];

  private menuItems: MenuItem[] = [
    {
      id: 'item_butter_chicken',
      categoryId: 'cat_mains',
      name: 'Butter Chicken',
      description: 'Tender chicken cooked in rich makhani gravy',
      basePrice: 350,
      station: 'GRILL',
      taxRate: 5,
      isActive: true,
      modifiers: [
        { id: 'mod_extra_butter', name: 'Extra Butter', priceDelta: 30 },
        { id: 'mod_less_spicy', name: 'Less Spicy', priceDelta: 0 },
      ],
    },
    {
      id: 'item_paneer_tikka',
      categoryId: 'cat_starters',
      name: 'Paneer Tikka',
      description: 'Char-grilled cottage cheese cubes with spices',
      basePrice: 280,
      station: 'GRILL',
      taxRate: 5,
      isActive: true,
      modifiers: [],
    },
    {
      id: 'item_masala_coke',
      categoryId: 'cat_beverages',
      name: 'Masala Coke',
      description: 'Chilled cola with roasted cumin & chaat masala',
      basePrice: 90,
      station: 'BAR',
      taxRate: 5,
      isActive: true,
      modifiers: [],
    },
  ];

  getCategories(): MenuCategory[] {
    return this.categories.filter((c) => c.isActive);
  }

  getMenuItems(categoryId?: string): MenuItem[] {
    if (categoryId) {
      return this.menuItems.filter((i) => i.categoryId === categoryId && i.isActive);
    }
    return this.menuItems.filter((i) => i.isActive);
  }

  createMenuItem(item: Omit<MenuItem, 'id'>): MenuItem {
    const newItem: MenuItem = {
      ...item,
      id: `item_${Date.now()}`,
    };
    this.menuItems.push(newItem);
    return newItem;
  }
}
