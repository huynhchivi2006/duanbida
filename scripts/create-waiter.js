const { PrismaClient, Role, UserStatus } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_VI9kMfm1nbiy@ep-gentle-feather-b4vojltt.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require'
    }
  }
});

async function main() {
  const hash = await bcrypt.hash('Staff@123456', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'waiter@billiards.local' },
    update: {
      fullName: 'Nhân Viên Phục Bàn',
      phone: '0909000005',
      passwordHash: hash,
      role: Role.STAFF,
      status: UserStatus.ACTIVE
    },
    create: {
      email: 'waiter@billiards.local',
      fullName: 'Nhân Viên Phục Bàn',
      phone: '0909000005',
      passwordHash: hash,
      role: Role.STAFF,
      status: UserStatus.ACTIVE
    }
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'phucvu@billiards.local' },
    update: {
      fullName: 'Nguyễn Văn Phục (Phục Vụ Bàn)',
      phone: '0909000006',
      passwordHash: hash,
      role: Role.STAFF,
      status: UserStatus.ACTIVE
    },
    create: {
      email: 'phucvu@billiards.local',
      fullName: 'Nguyễn Văn Phục (Phục Vụ Bàn)',
      phone: '0909000006',
      passwordHash: hash,
      role: Role.STAFF,
      status: UserStatus.ACTIVE
    }
  });

  console.log('CREATED SUCCESSFULLY:');
  console.log('1.', user.fullName, '| Email:', user.email, '| Mật khẩu: Staff@123456');
  console.log('2.', user2.fullName, '| Email:', user2.email, '| Mật khẩu: Staff@123456');
  
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
