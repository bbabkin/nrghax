import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Support both new secret key format and legacy service role key
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please set SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedDatabase() {
  console.log('🌱 Starting database seed...');

  try {
    // Create test users
    console.log('Creating users...');

    // Create admin user
    const { data: adminAuth, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@test.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        name: 'Admin User'
      }
    });

    if (adminError && !adminError.message.includes('already been registered')) {
      throw adminError;
    }

    let adminId = adminAuth?.user?.id;

    // If user already exists, fetch their ID
    if (!adminId) {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingAdmin = existingUsers?.users?.find((u: any) => u.email === 'admin@test.com');
      if (existingAdmin) {
        adminId = existingAdmin.id;
      }
    }

    if (!adminId) {
      throw new Error('Could not get admin user ID');
    }

    console.log('✅ Admin user created:', adminAuth?.user?.email || 'Already exists');

    // Create regular user
    const { data: userAuth, error: userError } = await supabase.auth.admin.createUser({
      email: 'user@test.com',
      password: 'user123',
      email_confirm: true,
      user_metadata: {
        name: 'Test User'
      }
    });

    if (userError && !userError.message.includes('already been registered')) {
      throw userError;
    }

    let userId = userAuth?.user?.id;

    // If user already exists, fetch their ID
    if (!userId) {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find((u: any) => u.email === 'user@test.com');
      if (existingUser) {
        userId = existingUser.id;
      }
    }

    console.log('✅ Regular user created:', userAuth?.user?.email || 'Already exists');

    // Update admin profile to set is_admin flag
    if (adminAuth?.user?.id) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', adminAuth.user.id);

      if (profileError) {
        console.warn('Could not update admin profile:', profileError.message);
      } else {
        console.log('✅ Admin profile updated with is_admin flag');
      }
    }

    // Create some hacks if they don't exist
    console.log('Creating hacks...');

    const hacksToCreate = [
      {
        name: 'Morning Sunlight Exposure',
        slug: 'morning-sunlight-exposure',
        description: 'Get 10-15 minutes of direct sunlight within 30 minutes of waking to regulate circadian rhythm and boost energy.',
        content_type: 'content' as const,
        content_body: `# Morning Sunlight Exposure

Getting sunlight exposure in the morning is one of the most powerful ways to boost your energy naturally.

## Benefits:
- Regulates circadian rhythm
- Increases cortisol (in a good way)
- Improves sleep quality
- Boosts vitamin D production
- Enhances mood and alertness

## How to Practice:
1. Step outside within 30 minutes of waking
2. Get 10-15 minutes of direct sunlight
3. Don't wear sunglasses (but never look directly at sun)
4. Combine with light movement or walking
5. Do this consistently every day

## Tips:
- Cloudy days still work (need 20-30 minutes)
- Window light is less effective (50% reduction)
- Earlier is better for circadian entrainment`,
        difficulty: 'Easy',
        time_minutes: 15,
        created_by: adminId
      },
      {
        name: 'Cold Water Immersion',
        slug: 'cold-water-immersion',
        description: 'Take a 2-3 minute cold shower or ice bath to boost dopamine and increase energy for hours.',
        content_type: 'content' as const,
        content_body: `# Cold Water Immersion

Cold exposure is a powerful tool for increasing energy and mental resilience.

## Benefits:
- 250% increase in dopamine (lasting hours)
- Improved immune function
- Increased metabolism
- Better stress resilience
- Enhanced mood and focus

## Protocol:
1. Start with 30 seconds of cold at end of shower
2. Gradually increase to 2-3 minutes
3. Water temperature: 50-59°F (10-15°C)
4. Focus on calm breathing
5. Do 3-4 times per week minimum

## Safety:
- Never do if you have heart conditions
- Start gradually
- Never force beyond comfort
- Exit if you feel faint`,
        difficulty: 'Hard',
        time_minutes: 5,
        created_by: adminId
      },
      {
        name: 'Box Breathing Exercise',
        slug: 'box-breathing-exercise',
        description: 'Practice 4-4-4-4 breathing pattern to reduce stress and increase mental clarity.',
        content_type: 'content' as const,
        content_body: `# Box Breathing Exercise

A simple yet powerful breathing technique used by Navy SEALs and high performers.

## The Pattern:
- Inhale for 4 counts
- Hold for 4 counts
- Exhale for 4 counts
- Hold for 4 counts

## Benefits:
- Reduces stress and anxiety
- Improves focus and concentration
- Balances autonomic nervous system
- Increases energy without stimulants
- Enhances emotional regulation

## Practice Guide:
1. Sit comfortably with straight back
2. Exhale completely
3. Begin the 4-4-4-4 pattern
4. Repeat for 4-5 cycles
5. Return to normal breathing

Use before important meetings, during stress, or as daily practice.`,
        difficulty: 'Easy',
        time_minutes: 5,
        created_by: adminId
      },
      {
        name: 'Power Napping',
        slug: 'power-napping',
        description: 'Take a 10-20 minute nap to restore energy and improve cognitive performance.',
        content_type: 'content' as const,
        content_body: `# Power Napping

Strategic napping can dramatically improve afternoon energy and performance.

## Optimal Duration:
- 10 minutes: Quick refresh
- 20 minutes: Ideal for most people
- 90 minutes: Full sleep cycle (if time allows)

## Timing:
- Best: 1-3 PM (post-lunch dip)
- Avoid: After 3 PM (affects night sleep)
- Not before: Important tasks

## Setup:
1. Dark, quiet environment
2. Comfortable temperature (slightly cool)
3. Set alarm for 20 minutes
4. Elevate feet slightly
5. Use eye mask if needed

## Pro Tips:
- Drink coffee before nap (kicks in after 20 min)
- Don't nap if you have insomnia
- Be consistent with timing`,
        difficulty: 'Easy',
        time_minutes: 20,
        created_by: adminId
      },
      {
        name: 'Intermittent Fasting',
        slug: 'intermittent-fasting',
        description: 'Practice 16:8 fasting protocol to improve metabolic health and mental clarity.',
        content_type: 'content' as const,
        content_body: `# Intermittent Fasting

Time-restricted eating can significantly boost energy and mental performance.

## 16:8 Protocol:
- Fast for 16 hours
- Eat within 8-hour window
- Example: Eat 12 PM - 8 PM

## Benefits:
- Improved insulin sensitivity
- Enhanced mental clarity
- Increased HGH production
- Better metabolic flexibility
- Cellular autophagy

## Getting Started:
1. Start with 12:12, progress to 16:8
2. Stay hydrated during fast
3. Black coffee/tea allowed
4. Eat nutrient-dense foods
5. Break fast with protein

## Tips:
- Consistency matters more than perfection
- Listen to your body
- Not for everyone (check with doctor)`,
        difficulty: 'Medium',
        time_minutes: 0,
        created_by: adminId
      }
    ];

    const createdHacks = [];
    for (const hackData of hacksToCreate) {
      const { data: existingHack } = await supabase
        .from('hacks')
        .select('id')
        .eq('slug', hackData.slug)
        .single();

      if (!existingHack) {
        const { data: hack, error: hackError } = await supabase
          .from('hacks')
          .insert(hackData)
          .select()
          .single();

        if (hackError) {
          console.warn(`Could not create hack ${hackData.name}:`, hackError.message);
        } else {
          createdHacks.push(hack);
          console.log(`✅ Created hack: ${hack.name}`);
        }
      } else {
        // Get the existing hack details
        const { data: hack } = await supabase
          .from('hacks')
          .select('*')
          .eq('slug', hackData.slug)
          .single();

        if (hack) {
          createdHacks.push(hack);
          console.log(`ℹ️ Hack already exists: ${hackData.name}`);
        }
      }
    }

    // Create multiple public routines
    console.log('Creating public routines...');

    const routinesToCreate = [
      {
        name: 'Ultimate Morning Energy Routine',
        slug: 'ultimate-morning-energy-routine',
        description: 'A comprehensive morning routine designed to maximize your energy levels throughout the day. Combines proven techniques from neuroscience and biohacking.',
        is_public: true,
        created_by: adminId,
        hackSlugs: ['morning-sunlight-exposure', 'box-breathing-exercise', 'cold-water-immersion']
      },
      {
        name: 'Evening Wind Down',
        slug: 'evening-wind-down-routine',
        description: 'Calm your mind and body for restorative sleep with this relaxing evening routine.',
        is_public: true,
        created_by: adminId,
        hackSlugs: ['box-breathing-exercise', 'power-napping']
      },
      {
        name: 'Productivity Power Hour',
        slug: 'productivity-power-hour',
        description: 'Maximize your focus and get more done in less time with this productivity-focused routine.',
        is_public: true,
        created_by: adminId,
        hackSlugs: ['box-breathing-exercise', 'cold-water-immersion', 'morning-sunlight-exposure']
      },
      {
        name: 'Stress Buster Routine',
        slug: 'stress-buster-routine',
        description: 'Reduce stress and anxiety with these calming techniques backed by science.',
        is_public: true,
        created_by: adminId,
        hackSlugs: ['box-breathing-exercise', 'power-napping']
      },
      {
        name: 'Weekend Wellness Reset',
        slug: 'weekend-wellness-reset',
        description: 'Reset your body and mind on the weekends with this comprehensive wellness routine.',
        is_public: true,
        created_by: adminId,
        hackSlugs: ['morning-sunlight-exposure', 'cold-water-immersion', 'intermittent-fasting', 'power-napping', 'box-breathing-exercise']
      }
    ];

    for (const routineData of routinesToCreate) {
      // Check if routine already exists
      const { data: existingRoutine } = await supabase
        .from('routines')
        .select('id')
        .eq('slug', routineData.slug)
        .single();

      if (!existingRoutine) {
        const { hackSlugs, ...routineInsertData } = routineData;

        const { data: routine, error: routineError } = await supabase
          .from('routines')
          .insert(routineInsertData)
          .select()
          .single();

        if (routineError) {
          console.warn(`Could not create routine ${routineData.name}:`, routineError.message);
          continue;
        }

        console.log('✅ Created public routine:', routine.name);

        // Add hacks to routine
        if (hackSlugs && hackSlugs.length > 0) {
          // Get hack IDs from slugs
          const { data: hacksForRoutine } = await supabase
            .from('hacks')
            .select('id, slug')
            .in('slug', hackSlugs);

          if (hacksForRoutine && hacksForRoutine.length > 0) {
            const routineHacks = hackSlugs.map((slug, index) => {
              const hack = hacksForRoutine.find(h => h.slug === slug);
              return hack ? {
                routine_id: routine.id,
                hack_id: hack.id,
                position: index
              } : null;
            }).filter(Boolean);

            if (routineHacks.length > 0) {
              const { error: routineHacksError } = await supabase
                .from('routine_hacks')
                .insert(routineHacks);

              if (routineHacksError) {
                console.warn('Could not add hacks to routine:', routineHacksError.message);
              } else {
                console.log(`✅ Added ${routineHacks.length} hacks to routine: ${routine.name}`);
              }
            }
          }
        }
      } else {
        console.log('ℹ️ Public routine already exists:', routineData.name);
      }
    }

    // Create some tags
    console.log('Creating tags...');

    const tagsToCreate = [
      { name: 'Morning', slug: 'morning' },
      { name: 'Energy', slug: 'energy' },
      { name: 'Focus', slug: 'focus' },
      { name: 'Sleep', slug: 'sleep' },
      { name: 'Exercise', slug: 'exercise' },
      { name: 'Nutrition', slug: 'nutrition' },
      { name: 'Breathing', slug: 'breathing' },
      { name: 'Cold Therapy', slug: 'cold-therapy' },
      { name: 'Beginner Friendly', slug: 'beginner-friendly' },
      { name: 'Advanced', slug: 'advanced' }
    ];

    for (const tagData of tagsToCreate) {
      const { data: existingTag } = await supabase
        .from('tags')
        .select('id')
        .eq('slug', tagData.slug)
        .single();

      if (!existingTag) {
        const { error: tagError } = await supabase
          .from('tags')
          .insert(tagData);

        if (tagError) {
          console.warn(`Could not create tag ${tagData.name}:`, tagError.message);
        } else {
          console.log(`✅ Created tag: ${tagData.name}`);
        }
      } else {
        console.log(`ℹ️ Tag already exists: ${tagData.name}`);
      }
    }

    console.log('\n🎉 Database seeding complete!');
    console.log('\n📧 Login credentials:');
    console.log('Admin: admin@test.com / admin123');
    console.log('User: user@test.com / user123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seed
seedDatabase().then(() => {
  console.log('\n✨ All done!');
  process.exit(0);
});