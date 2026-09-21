import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Hash password untuk demo user
  const passwordHash = await bcrypt.hash("Demo12345!", 12);

  // Cek apakah demo user sudah ada
  const existingUser = await prisma.user.findUnique({
    where: { email: "demo@findnote.local" },
  });

  if (existingUser) {
    console.log("⚠️  Demo user already exists, skipping...");
    return;
  }

  // Buat demo user
  const demoUser = await prisma.user.create({
    data: {
      name: "Demo User",
      email: "demo@findnote.local",
      passwordHash,
      wallets: {
        create: [
          {
            name: "Tunai",
            type: "CASH",
            initialBalance: 500000,
            currentBalance: 500000,
            currency: "IDR",
          },
          {
            name: "BCA",
            type: "BANK",
            initialBalance: 3000000,
            currentBalance: 3000000,
            currency: "IDR",
          },
          {
            name: "GoPay",
            type: "EWALLET",
            initialBalance: 150000,
            currentBalance: 150000,
            currency: "IDR",
          },
        ],
      },
      categories: {
        create: [
          { name: "Gaji", type: "INCOME", color: "#10B981", icon: "💰", isSystem: true },
          { name: "Makanan", type: "EXPENSE", color: "#F59E0B", icon: "🍔", isSystem: true },
          { name: "Transportasi", type: "EXPENSE", color: "#3B82F6", icon: "🚗", isSystem: true },
          { name: "Belanja", type: "EXPENSE", color: "#8B5CF6", icon: "🛒", isSystem: true },
          { name: "Tagihan", type: "EXPENSE", color: "#EF4444", icon: "📄", isSystem: true },
          { name: "Kesehatan", type: "EXPENSE", color: "#EC4899", icon: "🏥", isSystem: true },
          { name: "Hiburan", type: "EXPENSE", color: "#F97316", icon: "🎬", isSystem: true },
          { name: "Lainnya", type: "BOTH", color: "#6B7280", icon: "📁", isSystem: true },
        ],
      },
    },
    include: {
      wallets: true,
      categories: true,
    },
  });

  console.log(`✅ Created demo user: ${demoUser.email}`);

  // Ambil wallet dan kategori yang baru dibuat
  const wallets = await prisma.wallet.findMany({
    where: { userId: demoUser.id },
  });

  const categories = await prisma.category.findMany({
    where: { userId: demoUser.id },
  });

  const tunai = wallets.find((w) => w.name === "Tunai");
  const bca = wallets.find((w) => w.name === "BCA");
  const gopay = wallets.find((w) => w.name === "GoPay");

  const gajiCat = categories.find((c) => c.name === "Gaji");
  const makananCat = categories.find((c) => c.name === "Makanan");
  const transportasiCat = categories.find((c) => c.name === "Transportasi");
  const belanjaCat = categories.find((c) => c.name === "Belanja");
  const tagihanCat = categories.find((c) => c.name === "Tagihan");
  const hiburanCat = categories.find((c) => c.name === "Hiburan");

  if (!tunai || !bca || !gopay || !gajiCat || !makananCat || !transportasiCat || !belanjaCat || !tagihanCat || !hiburanCat) {
    console.error("❌ Failed to find wallets or categories");
    return;
  }

  // Buat transaksi demo untuk bulan ini
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const transactions = await prisma.transaction.createMany({
    data: [
      {
        userId: demoUser.id,
        walletId: bca.id,
        categoryId: gajiCat.id,
        type: "INCOME",
        amount: 8000000,
        date: firstDayOfMonth,
        note: "Gaji bulanan",
      },
      {
        userId: demoUser.id,
        walletId: tunai.id,
        categoryId: makananCat.id,
        type: "EXPENSE",
        amount: 50000,
        date: new Date(now.getFullYear(), now.getMonth(), 2),
        note: "Makan siang",
      },
      {
        userId: demoUser.id,
        walletId: gopay.id,
        categoryId: transportasiCat.id,
        type: "EXPENSE",
        amount: 35000,
        date: new Date(now.getFullYear(), now.getMonth(), 3),
        note: "Ojek online",
      },
      {
        userId: demoUser.id,
        walletId: bca.id,
        categoryId: belanjaCat.id,
        type: "EXPENSE",
        amount: 500000,
        date: new Date(now.getFullYear(), now.getMonth(), 5),
        note: "Belanja bulanan",
      },
      {
        userId: demoUser.id,
        walletId: bca.id,
        categoryId: tagihanCat.id,
        type: "EXPENSE",
        amount: 300000,
        date: new Date(now.getFullYear(), now.getMonth(), 10),
        note: "Listrik & air",
      },
      {
        userId: demoUser.id,
        walletId: tunai.id,
        categoryId: hiburanCat.id,
        type: "EXPENSE",
        amount: 100000,
        date: new Date(now.getFullYear(), now.getMonth(), 15),
        note: "Nonton bioskop",
      },
    ],
  });

  console.log(`✅ Created ${transactions.count} demo transactions`);

  // Update saldo wallet berdasarkan transaksi
  const bcaTransactions = await prisma.transaction.aggregate({
    where: { walletId: bca.id },
    _sum: {
      amount: true,
    },
  });

  const incomeBca = await prisma.transaction.aggregate({
    where: { walletId: bca.id, type: "INCOME" },
    _sum: { amount: true },
  });

  const expenseBca = await prisma.transaction.aggregate({
    where: { walletId: bca.id, type: "EXPENSE" },
    _sum: { amount: true },
  });

  const newBcaBalance = bca.initialBalance.toNumber() + 
    (incomeBca._sum.amount?.toNumber() || 0) - 
    (expenseBca._sum.amount?.toNumber() || 0);

  await prisma.wallet.update({
    where: { id: bca.id },
    data: { currentBalance: newBcaBalance },
  });

  const tunaiIncome = await prisma.transaction.aggregate({
    where: { walletId: tunai.id, type: "INCOME" },
    _sum: { amount: true },
  });

  const tunaiExpense = await prisma.transaction.aggregate({
    where: { walletId: tunai.id, type: "EXPENSE" },
    _sum: { amount: true },
  });

  const newTunaiBalance = tunai.initialBalance.toNumber() + 
    (tunaiIncome._sum.amount?.toNumber() || 0) - 
    (tunaiExpense._sum.amount?.toNumber() || 0);

  await prisma.wallet.update({
    where: { id: tunai.id },
    data: { currentBalance: newTunaiBalance },
  });

  const gopayIncome = await prisma.transaction.aggregate({
    where: { walletId: gopay.id, type: "INCOME" },
    _sum: { amount: true },
  });

  const gopayExpense = await prisma.transaction.aggregate({
    where: { walletId: gopay.id, type: "EXPENSE" },
    _sum: { amount: true },
  });

  const newGopayBalance = gopay.initialBalance.toNumber() + 
    (gopayIncome._sum.amount?.toNumber() || 0) - 
    (gopayExpense._sum.amount?.toNumber() || 0);

  await prisma.wallet.update({
    where: { id: gopay.id },
    data: { currentBalance: newGopayBalance },
  });

  console.log("✅ Updated wallet balances");

  // Buat budget demo
  const budgets = await prisma.budget.createMany({
    data: [
      {
        userId: demoUser.id,
        categoryId: makananCat.id,
        amount: 1000000,
        isActive: true,
      },
      {
        userId: demoUser.id,
        categoryId: transportasiCat.id,
        amount: 300000,
        isActive: true,
      },
      {
        userId: demoUser.id,
        categoryId: hiburanCat.id,
        amount: 200000,
        isActive: true,
      },
    ],
  });

  console.log(`✅ Created ${budgets.count} demo budgets`);

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
