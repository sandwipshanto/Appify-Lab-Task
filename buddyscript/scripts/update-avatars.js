const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const avatars = [
  '/assets/images/f1.png',
  '/assets/images/f2.png',
  '/assets/images/f3.png',
  '/assets/images/f4.png',
  '/assets/images/f5.png',
  '/assets/images/f6.png',
  '/assets/images/f7.png',
  '/assets/images/f8.png',
  '/assets/images/f9.png',
];

async function main() {
  const users = await prisma.user.findMany();
  let updatedCount = 0;
  for (const user of users) {
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: randomAvatar },
    });
    console.log(`Updated user ${user.firstName} ${user.lastName} with avatar ${randomAvatar}`);
    updatedCount++;
  }
  console.log(`Successfully updated ${updatedCount} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
