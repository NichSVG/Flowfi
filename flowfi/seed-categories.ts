import { PrismaClient } from './src/generated/prisma/client';
import bcrypt from 'bcryptjs';

async function main() {
  const prisma = new PrismaClient();
  
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.category.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  
  console.log('Cleared all data');
  
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const demoUser = await prisma.user.create({
    data: {
      name: 'Demo User',
      email: 'demo@flowfi.com',
      password: hashedPassword,
      currency: 'IDR',
    },
  });
  
  console.log('Created demo user');
  
  const expenseCategories = [
    { name: 'Housing', icon: 'home', color: '#6366f1', subcategories: ['Rent/Mortgage', 'Electricity', 'Water', 'Internet', 'Gas', 'Home Maintenance'] },
    { name: 'Food & Dining', icon: 'utensils', color: '#ef4444', subcategories: ['Groceries', 'Restaurants', 'Coffee & Snacks', 'Food Delivery'] },
    { name: 'Transportation', icon: 'car', color: '#3b82f6', subcategories: ['Fuel', 'Public Transport', 'Ride-Hailing', 'Parking', 'Vehicle Maintenance', 'Toll Fees'] },
    { name: 'Shopping', icon: 'shopping-bag', color: '#ec4899', subcategories: ['Clothing', 'Electronics', 'Home Goods', 'Online Shopping', 'Convenience Store'] },
    { name: 'Entertainment', icon: 'gamepad-2', color: '#8b5cf6', subcategories: ['Movies', 'Games', 'Streaming Services', 'Hobbies', 'Events'] },
    { name: 'Health & Medical', icon: 'heart', color: '#10b981', subcategories: ['Doctor Visits', 'Medicine', 'Insurance', 'Fitness/Gym'] },
    { name: 'Education', icon: 'book-open', color: '#f59e0b', subcategories: ['School Fees', 'Courses', 'Books', 'Certifications'] },
    { name: 'Subscriptions', icon: 'repeat', color: '#06b6d4', subcategories: ['Streaming Services', 'Software Licenses', 'Cloud Storage'] },
    { name: 'Work & Business', icon: 'briefcase', color: '#84cc16', subcategories: ['Office Supplies', 'Software', 'Travel', 'Business Expenses'] },
    { name: 'Travel', icon: 'plane', color: '#f97316', subcategories: ['Flights', 'Hotels', 'Activities', 'Travel Insurance'] },
    { name: 'Family & Gifts', icon: 'gift', color: '#e11d48', subcategories: ['Gifts', 'Donations', 'Family Support', 'Celebrations'] },
    { name: 'Financial', icon: 'landmark', color: '#64748b', subcategories: ['Loan Payments', 'Credit Card Payments', 'Taxes', 'Investment Contributions', 'Bank Fees'] },
    { name: 'Miscellaneous', icon: 'package', color: '#6b7280', subcategories: ['Uncategorized', 'Unexpected Expenses'] },
  ];
  
  const incomeCategories = [
    { name: 'Salary', icon: 'briefcase', color: '#22c55e', subcategories: ['Base Salary', 'Bonus', 'Overtime', 'Allowances'] },
    { name: 'Freelance', icon: 'laptop', color: '#14b8a6', subcategories: ['Client Work', 'Consulting', 'Side Projects'] },
    { name: 'Investments', icon: 'trending-up', color: '#0ea5e9', subcategories: ['Dividends', 'Interest', 'Capital Gains', 'Rental Income'] },
    { name: 'Refunds', icon: 'rotate-ccw', color: '#a855f7', subcategories: ['Purchase Refunds', 'Cashback', 'Tax Refunds'] },
    { name: 'Other Income', icon: 'plus-circle', color: '#84cc16', subcategories: ['Gifts Received', 'Miscellaneous'] },
  ];
  
  for (const cat of expenseCategories) {
    const parent = await prisma.category.create({
      data: {
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: 'expense',
        userId: demoUser.id,
        isDefault: true,
      },
    });
    
    for (const subName of cat.subcategories) {
      await prisma.category.create({
        data: {
          name: subName,
          icon: cat.icon,
          color: cat.color,
          type: 'expense',
          userId: demoUser.id,
          isDefault: true,
          parentId: parent.id,
        },
      });
    }
  }
  
  for (const cat of incomeCategories) {
    const parent = await prisma.category.create({
      data: {
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: 'income',
        userId: demoUser.id,
        isDefault: true,
      },
    });
    
    for (const subName of cat.subcategories) {
      await prisma.category.create({
        data: {
          name: subName,
          icon: cat.icon,
          color: cat.color,
          type: 'income',
          userId: demoUser.id,
          isDefault: true,
          parentId: parent.id,
        },
      });
    }
  }
  
  console.log('Created categories with subcategories');
  
  const categories = await prisma.category.findMany({
    where: { userId: demoUser.id },
  });
  
  const getCatId = (name: string) => categories.find(c => c.name === name)?.id || '';
  
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  
  const transactions = [
    { amount: 8500000, type: 'income', description: 'Monthly Salary', date: new Date(thisYear, thisMonth, 1), categoryId: getCatId('Base Salary'), paymentMethod: 'Bank Transfer' },
    { amount: 1500000, type: 'income', description: 'Freelance Project', date: new Date(thisYear, thisMonth, 5), categoryId: getCatId('Client Work'), paymentMethod: 'PayPal' },
    { amount: 250000, type: 'income', description: 'Investment Dividend', date: new Date(thisYear, thisMonth, 10), categoryId: getCatId('Dividends'), paymentMethod: 'Bank Transfer' },
    { amount: 2500000, type: 'expense', description: 'Monthly Rent', date: new Date(thisYear, thisMonth, 1), categoryId: getCatId('Rent/Mortgage'), paymentMethod: 'Bank Transfer' },
    { amount: 450000, type: 'expense', description: 'Electricity Bill', date: new Date(thisYear, thisMonth, 5), categoryId: getCatId('Electricity'), paymentMethod: 'Bank Transfer' },
    { amount: 150000, type: 'expense', description: 'Internet Bill', date: new Date(thisYear, thisMonth, 5), categoryId: getCatId('Internet'), paymentMethod: 'Bank Transfer' },
    { amount: 85000, type: 'expense', description: 'Grocery Store', date: new Date(thisYear, thisMonth, 3), categoryId: getCatId('Groceries'), paymentMethod: 'Credit Card' },
    { amount: 45000, type: 'expense', description: 'Restaurant Dinner', date: new Date(thisYear, thisMonth, 7), categoryId: getCatId('Restaurants'), paymentMethod: 'Debit Card' },
    { amount: 25000, type: 'expense', description: 'Coffee Shop', date: new Date(thisYear, thisMonth, 8), categoryId: getCatId('Coffee & Snacks'), paymentMethod: 'E-Wallet' },
    { amount: 150000, type: 'expense', description: 'GoFood Order', date: new Date(thisYear, thisMonth, 9), categoryId: getCatId('Food Delivery'), paymentMethod: 'GoPay' },
    { amount: 200000, type: 'expense', description: 'Gas Station', date: new Date(thisYear, thisMonth, 4), categoryId: getCatId('Fuel'), paymentMethod: 'Debit Card' },
    { amount: 50000, type: 'expense', description: 'Grab Ride', date: new Date(thisYear, thisMonth, 6), categoryId: getCatId('Ride-Hailing'), paymentMethod: 'GrabPay' },
    { amount: 15000, type: 'expense', description: 'Parking Fee', date: new Date(thisYear, thisMonth, 6), categoryId: getCatId('Parking'), paymentMethod: 'Cash' },
    { amount: 320000, type: 'expense', description: 'New Shoes', date: new Date(thisYear, thisMonth, 14), categoryId: getCatId('Clothing'), paymentMethod: 'Credit Card' },
    { amount: 150000, type: 'expense', description: 'Tokopedia Purchase', date: new Date(thisYear, thisMonth, 12), categoryId: getCatId('Online Shopping'), paymentMethod: 'E-Wallet' },
    { amount: 65000, type: 'expense', description: 'Alfamart', date: new Date(thisYear, thisMonth, 11), categoryId: getCatId('Convenience Store'), paymentMethod: 'QRIS' },
    { amount: 65000, type: 'expense', description: 'Netflix Subscription', date: new Date(thisYear, thisMonth, 15), categoryId: getCatId('Streaming Services'), paymentMethod: 'Credit Card' },
    { amount: 50000, type: 'expense', description: 'Spotify Premium', date: new Date(thisYear, thisMonth, 15), categoryId: getCatId('Streaming Services'), paymentMethod: 'Credit Card' },
    { amount: 150000, type: 'expense', description: 'Gym Membership', date: new Date(thisYear, thisMonth, 1), categoryId: getCatId('Fitness/Gym'), paymentMethod: 'Debit Card' },
    { amount: 75000, type: 'expense', description: 'Medicine', date: new Date(thisYear, thisMonth, 10), categoryId: getCatId('Medicine'), paymentMethod: 'Cash' },
    { amount: 250000, type: 'expense', description: 'Online Course', date: new Date(thisYear, thisMonth, 8), categoryId: getCatId('Courses'), paymentMethod: 'Credit Card' },
    { amount: 500000, type: 'expense', description: 'Credit Card Payment', date: new Date(thisYear, thisMonth, 20), categoryId: getCatId('Credit Card Payments'), paymentMethod: 'Bank Transfer' },
    { amount: 100000, type: 'expense', description: 'Gift for Friend', date: new Date(thisYear, thisMonth, 18), categoryId: getCatId('Gifts'), paymentMethod: 'Cash' },
  ];
  
  await prisma.transaction.createMany({
    data: transactions.map(t => ({
      ...t,
      userId: demoUser.id,
    })),
  });
  
  console.log('Created', transactions.length, 'demo transactions');
  
  const foodCat = getCatId('Food & Dining');
  const transportCat = getCatId('Transportation');
  const housingCat = getCatId('Housing');
  const entertainmentCat = getCatId('Entertainment');
  
  await prisma.budget.createMany({
    data: [
      { amount: 2000000, period: 'monthly', startDate: new Date(thisYear, thisMonth, 1), userId: demoUser.id, categoryId: foodCat },
      { amount: 1500000, period: 'monthly', startDate: new Date(thisYear, thisMonth, 1), userId: demoUser.id, categoryId: transportCat },
      { amount: 3000000, period: 'monthly', startDate: new Date(thisYear, thisMonth, 1), userId: demoUser.id, categoryId: housingCat },
      { amount: 500000, period: 'monthly', startDate: new Date(thisYear, thisMonth, 1), userId: demoUser.id, categoryId: entertainmentCat },
    ],
  });
  
  console.log('Created demo budgets');
  
  await prisma.goal.createMany({
    data: [
      { name: 'Emergency Fund', description: '6 months of expenses', targetAmount: 50000000, currentAmount: 25000000, deadline: new Date(thisYear + 1, 0, 1), status: 'active', userId: demoUser.id, color: '#22c55e' },
      { name: 'New Laptop', description: 'MacBook Pro for work', targetAmount: 25000000, currentAmount: 15000000, deadline: new Date(thisYear, thisMonth + 3, 1), status: 'active', userId: demoUser.id, color: '#3b82f6' },
      { name: 'Vacation', description: 'Trip to Japan', targetAmount: 30000000, currentAmount: 10000000, deadline: new Date(thisYear, thisMonth + 6, 1), status: 'active', userId: demoUser.id, color: '#8b5cf6' },
    ],
  });
  
  console.log('Created demo goals');
  console.log('Demo account seeded successfully!');
  console.log('Login with: demo@flowfi.com / password123');
  
  await prisma.$disconnect();
}

main().catch(console.error);
