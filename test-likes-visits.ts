import prisma from './src/lib/db';

async function testLikesAndVisits() {
  console.log('Testing Likes and Visits functionality...\n');

  try {
    // 1. First, check if we have any users
    const users = await prisma.user.findMany({
      take: 1
    });

    console.log(`Found ${users.length} users in database`);

    if (users.length === 0) {
      console.log('Creating a test user...');
      const testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          isAdmin: false
        }
      });
      users.push(testUser);
      console.log('Test user created:', testUser.email);
    }

    const userId = users[0].id;
    console.log('Using user:', users[0].email);

    // 2. Check if we have any hacks
    const hacks = await prisma.hack.findMany({
      take: 1
    });

    console.log(`\nFound ${hacks.length} hacks in database`);

    if (hacks.length === 0) {
      console.log('No hacks found. Please create some hacks first.');
      return;
    }

    const hackId = hacks[0].id;
    console.log('Testing with hack:', hacks[0].name);

    // 3. Test creating a like
    console.log('\n--- Testing Like Functionality ---');

    // Check if interaction exists
    let userHack = await prisma.userHack.findUnique({
      where: {
        userId_hackId: {
          userId: userId,
          hackId: hackId
        }
      }
    });

    if (!userHack) {
      console.log('Creating new user-hack interaction...');
      userHack = await prisma.userHack.create({
        data: {
          userId: userId,
          hackId: hackId,
          liked: true,
          viewed: false
        }
      });
      console.log('✅ Created like interaction');
    } else {
      console.log('Toggling existing like...');
      userHack = await prisma.userHack.update({
        where: { id: userHack.id },
        data: { liked: !userHack.liked }
      });
      console.log(`✅ Toggled like to: ${userHack.liked}`);
    }

    // 4. Test marking as viewed
    console.log('\n--- Testing View/Visit Functionality ---');

    userHack = await prisma.userHack.update({
      where: { id: userHack.id },
      data: {
        viewed: true,
        viewedAt: new Date()
      }
    });
    console.log('✅ Marked hack as viewed');

    // 5. Verify the data
    console.log('\n--- Verifying Data ---');
    const finalUserHack = await prisma.userHack.findUnique({
      where: {
        userId_hackId: {
          userId: userId,
          hackId: hackId
        }
      },
      include: {
        hack: true,
        user: true
      }
    });

    console.log('\nFinal state:');
    console.log('- User:', finalUserHack?.user?.email);
    console.log('- Hack:', finalUserHack?.hack?.name);
    console.log('- Liked:', finalUserHack?.liked);
    console.log('- Viewed:', finalUserHack?.viewed);
    console.log('- ViewedAt:', finalUserHack?.viewedAt);

    // 6. Count total likes for the hack
    const likeCount = await prisma.userHack.count({
      where: {
        hackId: hackId,
        liked: true
      }
    });
    console.log(`\nTotal likes for this hack: ${likeCount}`);

    // 7. Count total views for the hack
    const viewCount = await prisma.userHack.count({
      where: {
        hackId: hackId,
        viewed: true
      }
    });
    console.log(`Total views for this hack: ${viewCount}`);

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLikesAndVisits();