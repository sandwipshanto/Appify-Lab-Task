/**
 * One-off script to backfill generated avatars for existing users who have no avatar set.
 * Run with: npx tsx scripts/backfill-avatars.ts
 */

import { PrismaClient } from '@prisma/client';

const PALETTE = [
  '4F46E5', '7C3AED', 'DB2777', 'DC2626', 'D97706',
  '059669', '0284C7', '0891B2', '9333EA', 'EA580C',
  '16A34A', '2563EB', 'BE185D', '0F766E', 'B45309', '6D28D9',
];

function pickColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function generateAvatarUrl(firstName: string, lastName: string): string {
  const name = `${firstName}+${lastName}`;
  const color = pickColor(`${firstName}${lastName}`.toLowerCase());
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=128&bold=true&format=png`;
}

async function main() {
  const prisma = new PrismaClient();

  try {
    const users = await prisma.user.findMany({
      where: { avatar: null },
      select: { id: true, firstName: true, lastName: true },
    });

    console.log(`Found ${users.length} users without avatars.`);

    for (const user of users) {
      const avatar = generateAvatarUrl(user.firstName, user.lastName);
      await prisma.user.update({
        where: { id: user.id },
        data: { avatar },
      });
      console.log(`  ✓ ${user.firstName} ${user.lastName} → ${avatar}`);
    }

    console.log('\nDone! All existing users now have avatars.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
