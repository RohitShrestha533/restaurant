import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const staffPassword = await bcrypt.hash('staff123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@rms.com' },
    update: {},
    create: { email: 'admin@rms.com', password: adminPassword, name: 'Admin User', role: 'ADMIN', phone: '9800000001' },
  });

  await prisma.user.upsert({
    where: { email: 'manager@rms.com' },
    update: {},
    create: { email: 'manager@rms.com', password: staffPassword, name: 'Manager User', role: 'MANAGER', phone: '9800000002' },
  });

  await prisma.user.upsert({
    where: { email: 'waiter@rms.com' },
    update: {},
    create: { email: 'waiter@rms.com', password: staffPassword, name: 'Waiter User', role: 'WAITER', phone: '9800000003' },
  });

  await prisma.user.upsert({
    where: { email: 'kitchen@rms.com' },
    update: {},
    create: { email: 'kitchen@rms.com', password: staffPassword, name: 'Kitchen Staff', role: 'KITCHEN', phone: '9800000004' },
  });

  await prisma.user.upsert({
    where: { email: 'cashier@rms.com' },
    update: {},
    create: { email: 'cashier@rms.com', password: staffPassword, name: 'Cashier User', role: 'CASHIER', phone: '9800000005' },
  });

  await prisma.user.upsert({
    where: { email: 'delivery@rms.com' },
    update: {},
    create: { email: 'delivery@rms.com', password: staffPassword, name: 'Delivery Driver', role: 'DELIVERY', phone: '9800000006' },
  });

  // Create tables
  for (let i = 1; i <= 12; i++) {
    await prisma.table.upsert({
      where: { number: i },
      update: {},
      create: {
        number: i,
        capacity: i <= 4 ? 2 : i <= 8 ? 4 : 6,
        section: i <= 4 ? 'Indoor' : i <= 8 ? 'Outdoor' : 'VIP',
      },
    });
  }

  // Create categories and menu items
  const categories = [
    { name: 'Appetizers', items: [
      { name: 'Spring Rolls', price: 8.99, description: 'Crispy vegetable spring rolls' },
      { name: 'Garlic Bread', price: 5.99, description: 'Toasted bread with garlic butter' },
      { name: 'Soup of the Day', price: 6.99, description: 'Fresh daily soup' },
      { name: 'Bruschetta', price: 7.99, description: 'Tomato basil bruschetta' },
    ]},
    { name: 'Main Course', items: [
      { name: 'Grilled Chicken', price: 18.99, description: 'Herb-marinated grilled chicken' },
      { name: 'Beef Steak', price: 24.99, description: '8oz premium beef steak' },
      { name: 'Pasta Carbonara', price: 15.99, description: 'Classic Italian pasta' },
      { name: 'Fish & Chips', price: 16.99, description: 'Beer-battered fish with fries' },
      { name: 'Vegetable Curry', price: 14.99, description: 'Spicy mixed vegetable curry' },
    ]},
    { name: 'Desserts', items: [
      { name: 'Chocolate Cake', price: 8.99, description: 'Rich chocolate layer cake' },
      { name: 'Ice Cream Sundae', price: 6.99, description: 'Three scoops with toppings' },
      { name: 'Tiramisu', price: 9.99, description: 'Classic Italian coffee dessert' },
    ]},
    { name: 'Beverages', items: [
      { name: 'Fresh Juice', price: 4.99, description: 'Orange, apple, or mixed' },
      { name: 'Coffee', price: 3.99, description: 'Freshly brewed coffee' },
      { name: 'Iced Tea', price: 3.49, description: 'Chilled lemon iced tea' },
      { name: 'Smoothie', price: 5.99, description: 'Fruit smoothie blend' },
    ]},
  ];

  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name },
    });

    for (const item of cat.items) {
      const existing = await prisma.menuItem.findFirst({ where: { name: item.name, categoryId: category.id } });
      if (!existing) {
        await prisma.menuItem.create({
          data: { ...item, categoryId: category.id },
        });
      }
    }
  }

  // Create inventory items
  const inventoryItems = [
    { name: 'Chicken Breast', quantity: 50, unit: 'KG', minStock: 10, costPerUnit: 8.0, supplier: 'Fresh Farms' },
    { name: 'Beef Tenderloin', quantity: 30, unit: 'KG', minStock: 5, costPerUnit: 15.0, supplier: 'Premium Meats' },
    { name: 'Pasta', quantity: 40, unit: 'KG', minStock: 10, costPerUnit: 3.0, supplier: 'Italian Imports' },
    { name: 'Cooking Oil', quantity: 20, unit: 'LITERS', minStock: 5, costPerUnit: 4.0, supplier: 'Kitchen Supply' },
    { name: 'Rice', quantity: 100, unit: 'KG', minStock: 20, costPerUnit: 2.0, supplier: 'Grain Co.' },
    { name: 'Vegetables Mixed', quantity: 60, unit: 'KG', minStock: 15, costPerUnit: 5.0, supplier: 'Fresh Farms' },
    { name: 'Coffee Beans', quantity: 15, unit: 'KG', minStock: 3, costPerUnit: 12.0, supplier: 'Bean Roasters' },
    { name: 'Milk', quantity: 30, unit: 'LITERS', minStock: 10, costPerUnit: 2.5, supplier: 'Dairy Fresh' },
  ];

  for (const item of inventoryItems) {
    const existing = await prisma.inventoryItem.findFirst({ where: { name: item.name } });
    if (!existing) {
      await prisma.inventoryItem.create({ data: item });
    }
  }

  console.log('Seed completed successfully!');
  console.log('Default credentials:');
  console.log('  Admin: admin@rms.com / admin123');
  console.log('  Staff: [role]@rms.com / staff123');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
