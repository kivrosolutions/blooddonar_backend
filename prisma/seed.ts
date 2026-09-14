import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.donor.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      fullName: 'Admin',
      phone: '03001234567',
      cnicNumber: '3520212345678',
      bloodGroup: 'O_POSITIVE',
      city: 'Lahore',
      area: 'Gulberg',
      role: 'ADMIN',
      isEmailVerified: true,
      isVerified: true,
      agreedToTermsAt: new Date(),
    },
  });

  console.log({ admin });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
