export type Role = 'ADMIN' | 'MANAGER' | 'WAITER' | 'KITCHEN' | 'CASHIER' | 'DELIVERY';
export type Permission = 'FULL' | 'VIEW' | 'CREATE' | 'OWN' | 'NONE';
export type Module = 'TABLES' | 'MENU' | 'ORDERS' | 'KITCHEN' | 'BILLING' | 'INVENTORY' | 'REPORTS' | 'USERS' | 'DELIVERY';

const RBAC_MATRIX: Record<Role, Record<Module, Permission>> = {
  ADMIN: {
    TABLES: 'FULL',
    MENU: 'FULL',
    ORDERS: 'FULL',
    KITCHEN: 'FULL',
    BILLING: 'FULL',
    INVENTORY: 'FULL',
    REPORTS: 'FULL',
    USERS: 'FULL',
    DELIVERY: 'FULL',
  },
  MANAGER: {
    TABLES: 'FULL',
    MENU: 'FULL',
    ORDERS: 'FULL',
    KITCHEN: 'FULL',
    BILLING: 'FULL',
    INVENTORY: 'FULL',
    REPORTS: 'FULL',
    USERS: 'NONE',
    DELIVERY: 'FULL',
  },
  WAITER: {
    TABLES: 'VIEW',
    MENU: 'VIEW',
    ORDERS: 'CREATE',
    KITCHEN: 'NONE',
    BILLING: 'NONE',
    INVENTORY: 'NONE',
    REPORTS: 'NONE',
    USERS: 'NONE',
    DELIVERY: 'NONE',
  },
  KITCHEN: {
    TABLES: 'NONE',
    MENU: 'VIEW',
    ORDERS: 'VIEW',
    KITCHEN: 'FULL',
    BILLING: 'NONE',
    INVENTORY: 'NONE',
    REPORTS: 'NONE',
    USERS: 'NONE',
    DELIVERY: 'NONE',
  },
  CASHIER: {
    TABLES: 'VIEW',
    MENU: 'NONE',
    ORDERS: 'VIEW',
    KITCHEN: 'NONE',
    BILLING: 'FULL',
    INVENTORY: 'NONE',
    REPORTS: 'NONE',
    USERS: 'NONE',
    DELIVERY: 'NONE',
  },
  DELIVERY: {
    TABLES: 'NONE',
    MENU: 'NONE',
    ORDERS: 'OWN',
    KITCHEN: 'NONE',
    BILLING: 'NONE',
    INVENTORY: 'NONE',
    REPORTS: 'NONE',
    USERS: 'NONE',
    DELIVERY: 'OWN',
  },
};

export function getPermission(role: Role, module: Module): Permission {
  return RBAC_MATRIX[role]?.[module] ?? 'NONE';
}

export function hasAccess(role: Role, module: Module, requiredPermission: Permission): boolean {
  const userPermission = getPermission(role, module);
  if (userPermission === 'FULL') return true;
  if (requiredPermission === 'VIEW' && ['VIEW', 'CREATE', 'OWN'].includes(userPermission)) return true;
  if (requiredPermission === 'CREATE' && ['CREATE'].includes(userPermission)) return true;
  if (requiredPermission === 'OWN' && ['OWN'].includes(userPermission)) return true;
  return userPermission === requiredPermission;
}
