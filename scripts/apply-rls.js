const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyRLSPolicies() {
  console.log('Applying RLS policies to local database...\n');

  const policies = [
    // Profiles
    `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY`,
    `CREATE POLICY "public_profiles_select" ON profiles FOR SELECT USING (true)`,
    `CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE USING (auth.uid() = id)`,

    // Hacks
    `ALTER TABLE hacks ENABLE ROW LEVEL SECURITY`,
    `CREATE POLICY "public_hacks_select" ON hacks FOR SELECT USING (true)`,
    `CREATE POLICY "admins_insert_hacks" ON hacks FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))`,
    `CREATE POLICY "admins_update_hacks" ON hacks FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))`,
    `CREATE POLICY "admins_delete_hacks" ON hacks FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))`,

    // Tags
    `ALTER TABLE tags ENABLE ROW LEVEL SECURITY`,
    `CREATE POLICY "public_tags_select" ON tags FOR SELECT USING (true)`,

    // HackTags
    `ALTER TABLE hack_tags ENABLE ROW LEVEL SECURITY`,
    `CREATE POLICY "public_hack_tags_select" ON hack_tags FOR SELECT USING (true)`,

    // UserHacks
    `ALTER TABLE user_hacks ENABLE ROW LEVEL SECURITY`,
    `CREATE POLICY "public_user_hacks_select" ON user_hacks FOR SELECT USING (true)`,
    `CREATE POLICY "users_insert_own_user_hacks" ON user_hacks FOR INSERT WITH CHECK (auth.uid() = user_id)`,
    `CREATE POLICY "users_update_own_user_hacks" ON user_hacks FOR UPDATE USING (auth.uid() = user_id)`,
    `CREATE POLICY "users_delete_own_user_hacks" ON user_hacks FOR DELETE USING (auth.uid() = user_id)`,

    // UserTags
    `ALTER TABLE user_tags ENABLE ROW LEVEL SECURITY`,
    `CREATE POLICY "users_select_own_tags" ON user_tags FOR SELECT USING (auth.uid() = user_id)`,
    `CREATE POLICY "users_insert_own_tags" ON user_tags FOR INSERT WITH CHECK (auth.uid() = user_id)`,
    `CREATE POLICY "users_update_own_tags" ON user_tags FOR UPDATE USING (auth.uid() = user_id)`,
    `CREATE POLICY "users_delete_own_tags" ON user_tags FOR DELETE USING (auth.uid() = user_id)`,

    // HackPrerequisites
    `ALTER TABLE hack_prerequisites ENABLE ROW LEVEL SECURITY`,
    `CREATE POLICY "public_prerequisites_select" ON hack_prerequisites FOR SELECT USING (true)`,
  ];

  let successCount = 0;
  let skipCount = 0;

  for (const sql of policies) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log(`✓ ${sql.substring(0, 60)}...`);
      successCount++;
    } catch (error) {
      if (error.message.includes('already exists') ||
          error.message.includes('row_security') ||
          error.message.includes('duplicate')) {
        console.log(`○ ${sql.substring(0, 60)}... (already exists)`);
        skipCount++;
      } else {
        console.error(`✗ ${sql.substring(0, 60)}...`);
        console.error(`  Error: ${error.message}`);
      }
    }
  }

  console.log(`\n✅ Applied ${successCount} new policies`);
  console.log(`○ Skipped ${skipCount} existing policies`);

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

applyRLSPolicies().catch(console.error);