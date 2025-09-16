const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function disableRLS() {
  console.log('Disabling RLS on tables for testing...\n');

  const tables = [
    'profiles',
    'hacks',
    'tags',
    'hack_tags',
    'user_hacks',
    'user_tags',
    'hack_prerequisites'
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY`);
      console.log(`✓ Disabled RLS on ${table}`);
    } catch (error) {
      console.error(`✗ Failed to disable RLS on ${table}:`, error.message);
    }
  }

  console.log('\n✅ RLS disabled. Tables should now be publicly accessible.');

  // Test if we can query hacks
  console.log('\nTesting hack access...');
  try {
    const hacks = await prisma.hack.findMany();
    console.log(`✓ Found ${hacks.length} hacks in database`);
  } catch (error) {
    console.error('✗ Could not query hacks:', error.message);
  }

  await prisma.$disconnect();
}

disableRLS().catch(console.error);