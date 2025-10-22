const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Check if admin user already exists
  const existingUser = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (existingUser) {
    console.log('Admin user already exists with ID:', existingUser.id);
    return;
  }

  // Create admin user with fixed ID
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.create({
    data: {
      id: '1',
      username: 'admin',
      password: hashedPassword,
      name: '管理者',
    },
  });

  console.log('Admin user created successfully:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
