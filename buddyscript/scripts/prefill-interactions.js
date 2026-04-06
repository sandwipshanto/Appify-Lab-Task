const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sampleComments = [
  "This is so awesome!",
  "Thanks for sharing.",
  "I completely agree with this.",
  "Looking forward to more updates!",
  "Great post! Totally relatable.",
  "Very cool! 😊",
  "Interesting perspective.",
  "Love the design and implementation.",
];

async function main() {
  const users = await prisma.user.findMany();
  const posts = await prisma.post.findMany();

  if (users.length === 0 || posts.length === 0) {
    console.log("Not enough users or posts to seed interactions.");
    return;
  }

  let totalLikesAdded = 0;
  let totalCommentsAdded = 0;
  let totalSharesSimulated = 0;

  for (const post of posts) {
    // 1. Give each post a random number of shares (0 - 5)
    const randomShares = Math.floor(Math.random() * 6);
    
    // 2. Give each post random likes (0 to 3)
    const randomLikeCount = Math.floor(Math.random() * 4);
    // Shuffle users
    const shuffledUsersForLikes = [...users].sort(() => 0.5 - Math.random());
    const likingUsers = shuffledUsersForLikes.slice(0, randomLikeCount);
    
    // Process likes
    let actualLikesAdded = 0;
    for (const u of likingUsers) {
      try {
        await prisma.postLike.create({
          data: {
            userId: u.id,
            postId: post.id,
          }
        });
        actualLikesAdded++;
      } catch (e) {
        // usually unique constraint violation if already liked, ignore
      }
    }

    // 3. Give each post random comments (0 to 2)
    const randomCommentCount = Math.floor(Math.random() * 3);
    const shuffledUsersForComments = [...users].sort(() => 0.5 - Math.random());
    const commentingUsers = shuffledUsersForComments.slice(0, randomCommentCount);
    
    let actualCommentsAdded = 0;
    for (const u of commentingUsers) {
      const commentText = sampleComments[Math.floor(Math.random() * sampleComments.length)];
      await prisma.comment.create({
        data: {
          content: commentText,
          postId: post.id,
          authorId: u.id,
        }
      });
      actualCommentsAdded++;
    }

    // Update Post counts
    if (Object.keys(post).includes('shareCount')) {
      await prisma.post.update({
        where: { id: post.id },
        data: {
          shareCount: { increment: randomShares },
          likeCount: { increment: actualLikesAdded },
          commentCount: { increment: actualCommentsAdded }
        }
      });
    }

    totalLikesAdded += actualLikesAdded;
    totalCommentsAdded += actualCommentsAdded;
    totalSharesSimulated += randomShares;
  }

  console.log('Seeding complete!');
  console.log(`Likes added: ${totalLikesAdded}`);
  console.log(`Comments added: ${totalCommentsAdded}`);
  console.log(`Shares added: ${totalSharesSimulated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
