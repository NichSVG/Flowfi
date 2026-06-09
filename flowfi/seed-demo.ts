import { PrismaClient } from './src/generated/prisma/client';
import bcrypt from 'bcryptjs';

async function main() {
  const prisma = new PrismaClient();
  
  const demoEmail = 'demo@flowfi.com';
  
  const existing = await prisma.user.findUnique({
    where: { email: demoEmail },
  });
  
  if (existing) {
    console.log('Demo user already exists, skipping seed');
    await prisma.$disconnect();
    return;
  }
  
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const user = await prisma.user.create({
    data: {
      name: 'Demo User',
      email: demoEmail,
      password: hashedPassword,
    },
  });
  
  console.log('Created demo user:', user.email);
  
  const categories = await prisma.category.createMany({
    data: [
      { name: 'Food & Dining', icon: 'utensils', color: '#ef4444', type: 'expense', userId: user.id, isDefault: true },
      { name: 'Transportation', icon: 'car', color: '#3b82f6', type: 'expense', userId: user.id, isDefault: true },
      { name: 'Bills & Utilities', icon: 'receipt', color: '#f59e0b', type: 'expense', userId: user.id, isDefault: true },
      { name: 'Entertainment', icon: 'film', color: '#8b5cf6', type: 'expense', userId: user.id, isDefault: true },
      { name: 'Shopping', icon: 'shopping-bag', color: '#ec4899', type: 'expense', userId: user.id, isDefault: true },
      { name: 'Health', icon: 'heart', color: '#10b981', type: 'expense', userId: user.id, isDefault: true },
      { name: 'Education', icon: 'book', color: '#6366f1', type: 'expense', userId: user.id, isDefault: true },
      { name: 'Other', icon: 'more-horizontal', color: '#6b7280', type: 'expense', userId: user.id, isDefault: true },
      { name: 'Salary', icon: 'briefcase', color: '#22c55e', type: 'income', userId: user.id, isDefault: true },
      { name: 'Freelance', icon: 'laptop', color: '#14b8a6', type: 'income', userId: user.id, isDefault: true },
      { name: 'Investments', icon: 'trending-up', color: '#0ea5e9', type: 'income', userId: user.id, isDefault: true },
      { name: 'Other Income', icon: 'plus-circle', color: '#84cc16', type: 'income', userId: user.id, isDefault: true },
    ],
  });
  
  const cats = await prisma.category.findMany({
    where: { userId: user.id },
  });
  
  const getCatId = (name: string) => cats.find(c => c.name === name)?.id || '';
  
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  
  const transactions = [
    { amount: 5200, type: 'income', description: 'Monthly Salary', date: new Date(thisYear, thisMonth, 1), categoryId: getCatId('Salary'), paymentMethod: 'Bank Transfer' },
    { amount: 850, type: 'income', description: 'Freelance Project', date: new Date(thisYear, thisMonth, 5), categoryId: getCatId('Freelance'), paymentMethod: 'PayPal' },
    { amount: 150, type: 'income', description: 'Investment Return', date: new Date(thisYear, thisMonth, 10), categoryId: getCatId('Investments'), paymentMethod: 'Bank Transfer' },
    { amount: 85.50, type: 'expense', description: 'Grocery Store', date: new Date(thisYear, thisMonth, 3), categoryId: getCatId('Food & Dining'), paymentMethod: 'Credit Card' },
    { amount: 45, type: 'expense', description: 'Restaurant Dinner', date: new Date(thisYear, thisMonth, 7), categoryId: getCatId('Food & Dining'), paymentMethod: 'Debit Card' },
    { amount: 120, type: 'expense', description: 'Electric Bill', date: new Date(thisYear, thisMonth, 5), categoryId: getCatId('Bills & Utilities'), paymentMethod: 'Bank Transfer' },
    { amount: 55, type: 'expense', description: 'Gas Station', date: new Date(thisYear, thisMonth, 8), categoryId: getCatId('Transportation'), paymentMethod: 'Credit Card' },
    { amount: 15.99, type: 'expense', description: 'Netflix Subscription', date: new Date(thisYear, thisMonth, 12), categoryId: getCatId('Entertainment'), paymentMethod: 'Credit Card' },
    { amount: 49.99, type: 'expense', description: 'Gym Membership', date: new Date(thisYear, thisMonth, 11), categoryId: getCatId('Health'), paymentMethod: 'Debit Card' },
    { amount: 29.99, type: 'expense', description: 'Online Course', date: new Date(thisYear, thisMonth, 10), categoryId: getCatId('Education'), paymentMethod: 'Credit Card' },
    { amount: 320, type: 'expense', description: 'New Shoes', date: new Date(thisYear, thisMonth, 14), categoryId: getCatId('Shopping'), paymentMethod: 'Credit Card' },
  ];
  
  await prisma.transaction.createMany({
    data: transactions.map(t => ({
      ...t,
      userId: user.id,
    })),
  });
  
  console.log('Created', transactions.length, 'demo transactions');
  
  await prisma.budget.createMany({
    data: [
      { amount: 500, period: 'monthly', startDate: new Date(thisYear, thisMonth, 1), userId: user.id, categoryId: getCatId('Food & Dining') },
      { amount: 300, period: 'monthly', startDate: new Date(thisYear, thisMonth, 1), userId: user.id, categoryId: getCatId('Transportation') },
      { amount: 600, period: 'monthly', startDate: new Date(thisYear, thisMonth, 1), userId: user.id, categoryId: getCatId('Bills & Utilities') },
      { amount: 200, period: 'monthly', startDate: new Date(thisYear, thisMonth, 1), userId: user.id, categoryId: getCatId('Entertainment') },
    ],
  });
  
  console.log('Created demo budgets');
  
  await prisma.goal.createMany({
    data: [
      { name: 'Emergency Fund', description: '6 months of expenses', targetAmount: 15000, currentAmount: 8500, deadline: new Date(thisYear + 1, 0, 1), status: 'active', userId: user.id, color: '#22c55e' },
      { name: 'New Laptop', description: 'MacBook Pro for work', targetAmount: 2500, currentAmount: 1800, deadline: new Date(thisYear, thisMonth + 3, 1), status: 'active', userId: user.id, color: '#3b82f6' },
      { name: 'Vacation', description: 'Trip to Japan', targetAmount: 5000, currentAmount: 2200, deadline: new Date(thisYear, thisMonth + 6, 1), status: 'active', userId: user.id, color: '#8b5cf6' },
    ],
  });
  
  console.log('Created demo goals');
  console.log('Demo account seeded successfully!');
  console.log('Login with: demo@flowfi.com / password123');
  
  await prisma.$disconnect();
}

main().catch(console.error);
