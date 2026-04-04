import { PrismaClient, Visibility } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const CLOUDINARY_SAMPLES = [
  'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
  'https://res.cloudinary.com/demo/image/upload/v1580305585/samples/landscapes/beach-boat.jpg',
  'https://res.cloudinary.com/demo/image/upload/v1580305585/samples/landscapes/nature-mountains.jpg',
  'https://res.cloudinary.com/demo/image/upload/v1580305585/samples/food/spices.jpg',
  'https://res.cloudinary.com/demo/image/upload/v1580305585/samples/animals/three-dogs.jpg',
];

async function main() {
  console.log('Seeding database...');

  const password = await hash('Demo1234', 10);

  // Create 3 demo users
  const [alice, bob, charlie] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'alice@demo.com' },
      update: {},
      create: { firstName: 'Alice', lastName: 'Johnson', email: 'alice@demo.com', password },
    }),
    prisma.user.upsert({
      where: { email: 'bob@demo.com' },
      update: {},
      create: { firstName: 'Bob', lastName: 'Smith', email: 'bob@demo.com', password },
    }),
    prisma.user.upsert({
      where: { email: 'charlie@demo.com' },
      update: {},
      create: { firstName: 'Charlie', lastName: 'Brown', email: 'charlie@demo.com', password },
    }),
  ]);

  const users = [alice, bob, charlie];
  console.log(`Created ${users.length} users`);

  // Create posts
  const postData: { content: string; authorId: string; visibility: Visibility; imageUrl?: string }[] = [
    { content: 'Just started learning Next.js and I am loving it! The App Router is a game-changer for building modern web apps.', authorId: alice.id, visibility: 'PUBLIC', imageUrl: CLOUDINARY_SAMPLES[0] },
    { content: 'Beautiful day at the beach today. Sometimes you just need to disconnect and enjoy nature.', authorId: bob.id, visibility: 'PUBLIC', imageUrl: CLOUDINARY_SAMPLES[1] },
    { content: 'Mountain hiking is the best therapy. Who agrees?', authorId: charlie.id, visibility: 'PUBLIC', imageUrl: CLOUDINARY_SAMPLES[2] },
    { content: 'Cooking with fresh spices makes all the difference. Just made an amazing curry!', authorId: alice.id, visibility: 'PUBLIC', imageUrl: CLOUDINARY_SAMPLES[3] },
    { content: 'My three dogs are the highlight of my day, every single day.', authorId: bob.id, visibility: 'PUBLIC', imageUrl: CLOUDINARY_SAMPLES[4] },
    { content: 'Working on a new project. Can not wait to share it with everyone!', authorId: charlie.id, visibility: 'PUBLIC' },
    { content: 'The secret to productivity? Take breaks. Seriously.', authorId: alice.id, visibility: 'PUBLIC' },
    { content: 'Just finished reading "Clean Code" by Robert C. Martin. Highly recommend for every developer.', authorId: bob.id, visibility: 'PUBLIC' },
    { content: 'PostgreSQL + Prisma is such a solid combo for building APIs.', authorId: charlie.id, visibility: 'PUBLIC' },
    { content: 'Does anyone else find TypeScript generics confusing at first but then love them?', authorId: alice.id, visibility: 'PUBLIC' },
    { content: 'Private note to self: need to review the deployment checklist before going live.', authorId: bob.id, visibility: 'PRIVATE' },
    { content: 'Just deployed my first app to Vercel. So smooth!', authorId: charlie.id, visibility: 'PUBLIC' },
    { content: 'Weekend plans: code, coffee, repeat.', authorId: alice.id, visibility: 'PUBLIC' },
    { content: 'Personal reminder: update the API documentation by Friday.', authorId: alice.id, visibility: 'PRIVATE' },
    { content: 'React Server Components are the future. Change my mind.', authorId: bob.id, visibility: 'PUBLIC' },
    { content: 'Had an amazing team standup today. Great alignment on Q2 goals.', authorId: charlie.id, visibility: 'PUBLIC' },
    { content: 'CSS Grid vs Flexbox? The answer is both, depending on the layout.', authorId: alice.id, visibility: 'PUBLIC' },
    { content: 'Debugging is like being a detective in a crime movie where you are also the criminal.', authorId: bob.id, visibility: 'PUBLIC' },
  ];

  const posts = [];
  for (const data of postData) {
    const post = await prisma.post.create({
      data: {
        content: data.content,
        imageUrl: data.imageUrl || null,
        visibility: data.visibility,
        authorId: data.authorId,
      },
    });
    posts.push(post);
    // Small delay so createdAt timestamps differ
    await new Promise((r) => setTimeout(r, 50));
  }
  console.log(`Created ${posts.length} posts`);

  // Create likes on posts
  const postLikes: { userId: string; postId: string }[] = [
    { userId: bob.id, postId: posts[0].id },
    { userId: charlie.id, postId: posts[0].id },
    { userId: alice.id, postId: posts[1].id },
    { userId: charlie.id, postId: posts[1].id },
    { userId: alice.id, postId: posts[2].id },
    { userId: bob.id, postId: posts[2].id },
    { userId: bob.id, postId: posts[3].id },
    { userId: alice.id, postId: posts[4].id },
    { userId: charlie.id, postId: posts[5].id },
    { userId: alice.id, postId: posts[6].id },
    { userId: bob.id, postId: posts[7].id },
    { userId: charlie.id, postId: posts[8].id },
    { userId: bob.id, postId: posts[9].id },
    { userId: charlie.id, postId: posts[9].id },
    { userId: alice.id, postId: posts[11].id },
    { userId: bob.id, postId: posts[14].id },
    { userId: alice.id, postId: posts[15].id },
    { userId: charlie.id, postId: posts[16].id },
    { userId: alice.id, postId: posts[17].id },
    { userId: charlie.id, postId: posts[17].id },
  ];

  for (const like of postLikes) {
    await prisma.postLike.upsert({
      where: { userId_postId: { userId: like.userId, postId: like.postId } },
      update: {},
      create: like,
    });
  }
  console.log(`Created ${postLikes.length} post likes`);

  // Update post like counts
  const postLikeCounts = new Map<string, number>();
  for (const like of postLikes) {
    postLikeCounts.set(like.postId, (postLikeCounts.get(like.postId) || 0) + 1);
  }
  for (const [postId, count] of postLikeCounts) {
    await prisma.post.update({ where: { id: postId }, data: { likeCount: count } });
  }

  // Create comments
  const commentData: { content: string; postId: string; authorId: string; parentId?: string }[] = [
    { content: 'Next.js is incredible! Have you tried the new Server Actions?', postId: posts[0].id, authorId: bob.id },
    { content: 'Absolutely love the DX improvements in version 14.', postId: posts[0].id, authorId: charlie.id },
    { content: 'Where is this beach? Looks amazing!', postId: posts[1].id, authorId: alice.id },
    { content: 'I need to go on a trip soon. This is so relaxing just looking at it.', postId: posts[1].id, authorId: charlie.id },
    { content: 'Hiking is the best! What trail was this?', postId: posts[2].id, authorId: alice.id },
    { content: 'Wow that curry looks delicious!', postId: posts[3].id, authorId: charlie.id },
    { content: 'Share the recipe please!', postId: posts[3].id, authorId: bob.id },
    { content: 'Dogs make everything better.', postId: posts[4].id, authorId: alice.id },
    { content: 'So true! Burnout is real.', postId: posts[6].id, authorId: bob.id },
    { content: 'TypeScript generics clicked for me after building a custom hook library.', postId: posts[9].id, authorId: bob.id },
    { content: 'Same here! The "aha" moment is worth the struggle.', postId: posts[9].id, authorId: charlie.id },
    { content: 'Vercel deploys are so fast. Love the preview URLs.', postId: posts[11].id, authorId: alice.id },
    { content: 'Haha, this is so accurate!', postId: posts[17].id, authorId: alice.id },
    { content: 'Console.log is my best debugging friend.', postId: posts[17].id, authorId: charlie.id },
  ];

  const comments = [];
  for (const data of commentData) {
    const comment = await prisma.comment.create({ data });
    comments.push(comment);
  }
  console.log(`Created ${comments.length} comments`);

  // Create replies
  const replyData = [
    { content: 'Yes! Server Actions are game-changing for forms.', postId: posts[0].id, authorId: alice.id, parentId: comments[0].id },
    { content: 'It is in Bali. Highly recommend!', postId: posts[1].id, authorId: bob.id, parentId: comments[2].id },
    { content: 'It was the Appalachian Trail. Amazing views!', postId: posts[2].id, authorId: charlie.id, parentId: comments[4].id },
    { content: 'I will post it later today!', postId: posts[3].id, authorId: alice.id, parentId: comments[6].id },
    { content: 'Building custom hooks was my turning point too!', postId: posts[9].id, authorId: alice.id, parentId: comments[9].id },
  ];

  const replies = [];
  for (const data of replyData) {
    const reply = await prisma.comment.create({ data });
    replies.push(reply);
  }
  console.log(`Created ${replies.length} replies`);

  // Update comment counts on posts
  const postCommentCounts = new Map<string, number>();
  for (const c of [...commentData, ...replyData]) {
    postCommentCounts.set(c.postId, (postCommentCounts.get(c.postId) || 0) + 1);
  }
  for (const [postId, count] of postCommentCounts) {
    await prisma.post.update({ where: { id: postId }, data: { commentCount: count } });
  }

  // Create comment likes
  const commentLikes = [
    { userId: alice.id, commentId: comments[0].id },
    { userId: charlie.id, commentId: comments[0].id },
    { userId: bob.id, commentId: comments[2].id },
    { userId: alice.id, commentId: comments[4].id },
    { userId: bob.id, commentId: comments[5].id },
    { userId: charlie.id, commentId: comments[8].id },
    { userId: alice.id, commentId: comments[9].id },
    { userId: bob.id, commentId: comments[12].id },
    { userId: alice.id, commentId: replies[0].id },
    { userId: bob.id, commentId: replies[1].id },
  ];

  for (const like of commentLikes) {
    await prisma.commentLike.upsert({
      where: { userId_commentId: { userId: like.userId, commentId: like.commentId } },
      update: {},
      create: like,
    });
  }
  console.log(`Created ${commentLikes.length} comment likes`);

  // Update comment like counts
  const commentLikeCounts = new Map<string, number>();
  for (const like of commentLikes) {
    commentLikeCounts.set(like.commentId, (commentLikeCounts.get(like.commentId) || 0) + 1);
  }
  for (const [commentId, count] of commentLikeCounts) {
    await prisma.comment.update({ where: { id: commentId }, data: { likeCount: count } });
  }

  console.log('Seeding complete!');
  console.log('Demo credentials: alice@demo.com / bob@demo.com / charlie@demo.com — password: Demo1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
