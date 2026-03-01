import { prisma } from "../lib/prisma";

async function main() {
  const user = await prisma.user.create({
    data: {
      email: "test@kimep.kz",
      name: "Test User",
      username: "testuser",
    },
  });

  const post = await prisma.post.create({
    data: {
      content: "Hello KIMEPian! ☕",
      anonymous: false,
      authorId: user.id,
    },
  });

  console.log("Created user:", user);
  console.log("Created post:", post);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });