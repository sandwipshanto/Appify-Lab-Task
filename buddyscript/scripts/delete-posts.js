const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true }
  });

  if (posts.length === 0) {
    console.log("No posts found to delete.");
    return;
  }

  const ids = posts.map(p => p.id);
  const deleted = await prisma.post.deleteMany({
    where: { id: { in: ids } }
  });

  console.log(`Successfully deleted ${deleted.count} posts.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
