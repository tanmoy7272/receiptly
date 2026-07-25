import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Receiptly database seeding...');

  // Hash password for development demo user
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // 1. Idempotently Upsert Demo User (Development Seed Only)
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@receiptly.app' },
    update: {
      name: 'Demo User',
      password: hashedPassword,
    },
    create: {
      email: 'demo@receiptly.app',
      name: 'Demo User',
      password: hashedPassword,
    },
  });

  console.log(`✅ Demo user seeded: ${demoUser.email} (ID: ${demoUser.id})`);

  // 2. Deterministic Sample Receipts Data
  const now = new Date();
  const sampleReceipts = [
    {
      id: 'rec_seed_001000000000000000000001',
      title: 'Logitech Wireless Mouse',
      merchant: 'Amazon India',
      merchantNormalized: 'amazon india',
      amount: 1299.0,
      currency: 'INR',
      purchaseDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2),
      category: 'Shopping',
      notes: 'Replacement mouse for workspace setup. Order #408-1294821',
      fileUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80',
      fileType: 'image/jpeg',
      aiExtractionStatus: 'COMPLETED',
    },
    {
      id: 'rec_seed_002000000000000000000002',
      title: 'Weekly Grocery Restock',
      merchant: 'Blinkit',
      merchantNormalized: 'blinkit',
      amount: 845.5,
      currency: 'INR',
      purchaseDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5),
      category: 'Groceries',
      notes: 'Organic milk, fruits, veggies, and pantry essentials',
      fileUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
      fileType: 'image/jpeg',
      aiExtractionStatus: 'COMPLETED',
    },
    {
      id: 'rec_seed_003000000000000000000003',
      title: 'Team Lunch & Coffee',
      merchant: 'Swiggy Gourmet',
      merchantNormalized: 'swiggy gourmet',
      amount: 1650.0,
      currency: 'INR',
      purchaseDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 8),
      category: 'Food',
      notes: 'Italian pasta and artisan coffee drinks',
      fileUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
      fileType: 'image/jpeg',
      aiExtractionStatus: 'COMPLETED',
    },
    {
      id: 'rec_seed_004000000000000000000004',
      title: 'Monthly Fiber Internet Bill',
      merchant: 'Airtel Broadband',
      merchantNormalized: 'airtel broadband',
      amount: 1179.0,
      currency: 'INR',
      purchaseDate: new Date(now.getFullYear(), now.getMonth() - 1, 10),
      category: 'Bills',
      notes: 'Account #102938491 - 300 Mbps unlimited plan',
      fileUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      fileType: 'image/jpeg',
      aiExtractionStatus: 'COMPLETED',
    },
    {
      id: 'rec_seed_005000000000000000000005',
      title: 'Electricity Utility Bill',
      merchant: 'State Electricity Board',
      merchantNormalized: 'state electricity board',
      amount: 2450.0,
      currency: 'INR',
      purchaseDate: new Date(now.getFullYear(), now.getMonth() - 1, 18),
      category: 'Bills',
      notes: 'Consumer No. 89201948 - Paid via UPI',
      fileUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&auto=format&fit=crop&q=80',
      fileType: 'image/jpeg',
      aiExtractionStatus: 'COMPLETED',
    },
    {
      id: 'rec_seed_006000000000000000000006',
      title: 'Flight Ticket to Bengaluru',
      merchant: 'IndiGo Airlines',
      merchantNormalized: 'indigo airlines',
      amount: 5890.0,
      currency: 'INR',
      purchaseDate: new Date(now.getFullYear(), now.getMonth() - 2, 5),
      category: 'Travel',
      notes: 'PNR #6X9K2L - Direct flight 6E-204',
      fileUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=80',
      fileType: 'image/jpeg',
      aiExtractionStatus: 'COMPLETED',
    },
    {
      id: 'rec_seed_007000000000000000000007',
      title: 'Prescription Medicines & Health Kit',
      merchant: 'Apollo Pharmacy',
      merchantNormalized: 'apollo pharmacy',
      amount: 620.0,
      currency: 'INR',
      purchaseDate: new Date(now.getFullYear(), now.getMonth() - 2, 14),
      category: 'Medical',
      notes: 'Vitamins, first-aid box supplies',
      fileUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
      fileType: 'image/jpeg',
      aiExtractionStatus: 'COMPLETED',
    },
    {
      id: 'rec_seed_008000000000000000000008',
      title: 'Semester Tuition Fee Receipt',
      merchant: 'Tech University',
      merchantNormalized: 'tech university',
      amount: 25000.0,
      currency: 'INR',
      purchaseDate: new Date(now.getFullYear(), now.getMonth() - 3, 1),
      category: 'Education',
      notes: 'Semester IV Course Registration & Library Deposit',
      fileUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80',
      fileType: 'image/jpeg',
      aiExtractionStatus: 'COMPLETED',
    },
    {
      id: 'rec_seed_009000000000000000000009',
      title: 'Ergonomic Desk Chair',
      merchant: 'Pepperfry',
      merchantNormalized: 'pepperfry',
      amount: 8900.0,
      currency: 'INR',
      purchaseDate: new Date(now.getFullYear(), now.getMonth() - 3, 20),
      category: 'Shopping',
      notes: 'High-back mesh chair with lumbar support. Invoice #PF-90182',
      fileUrl: 'https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?w=600&auto=format&fit=crop&q=80',
      fileType: 'image/jpeg',
      aiExtractionStatus: 'COMPLETED',
    },
    {
      id: 'rec_seed_010000000000000000000010',
      title: 'Dinner at Olive Bistro',
      merchant: 'Olive Bistro & Bar',
      merchantNormalized: 'olive bistro & bar',
      amount: 3200.0,
      currency: 'INR',
      purchaseDate: new Date(now.getFullYear(), now.getMonth() - 4, 12),
      category: 'Food',
      notes: 'Family anniversary celebration dinner',
      fileUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
      fileType: 'image/jpeg',
      aiExtractionStatus: 'COMPLETED',
    },
    {
      id: 'rec_seed_011000000000000000000011',
      title: 'Hotel Stay Invoice',
      merchant: 'Taj Hotels & Resorts',
      merchantNormalized: 'taj hotels & resorts',
      amount: 14500.0,
      currency: 'INR',
      purchaseDate: new Date(now.getFullYear(), now.getMonth() - 4, 25),
      category: 'Travel',
      notes: '2-night weekend stay booking #TJ-88910',
      fileUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=80',
      fileType: 'image/jpeg',
      aiExtractionStatus: 'COMPLETED',
    },
    {
      id: 'rec_seed_012000000000000000000012',
      title: 'Full Body Health Checkup',
      merchant: 'Max Healthcare',
      merchantNormalized: 'max healthcare',
      amount: 3500.0,
      currency: 'INR',
      purchaseDate: new Date(now.getFullYear(), now.getMonth() - 5, 4),
      category: 'Medical',
      notes: 'Annual comprehensive preventive health check package',
      fileUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80',
      fileType: 'image/jpeg',
      aiExtractionStatus: 'COMPLETED',
    },
  ];

  for (const receipt of sampleReceipts) {
    await prisma.receipt.upsert({
      where: { id: receipt.id },
      update: {
        ...receipt,
        userId: demoUser.id,
      },
      create: {
        ...receipt,
        userId: demoUser.id,
      },
    });
  }

  console.log(`✅ ${sampleReceipts.length} sample receipts seeded successfully.`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
