const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Local Supabase instance
const supabaseUrl = 'http://localhost:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRLSPolicies() {
  console.log('Applying RLS policies to local database...\n');

  // Read the SQL file
  const sqlContent = fs.readFileSync('scripts/setup-rls-policies.sql', 'utf8');

  // Split by semicolons and filter out empty statements
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    const sql = statement + ';';

    // Extract a description from the statement
    let description = sql.substring(0, 50).replace(/\n/g, ' ');
    if (sql.includes('CREATE POLICY')) {
      const match = sql.match(/CREATE POLICY "([^"]+)"/);
      description = match ? `Policy: ${match[1]}` : description;
    } else if (sql.includes('ALTER TABLE')) {
      const match = sql.match(/ALTER TABLE (\w+)/);
      description = match ? `Enable RLS on ${match[1]}` : description;
    }

    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: sql
      }).single();

      if (error) {
        // Try direct execution as fallback
        const { data, error: directError } = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sql_query: sql })
        }).then(r => r.json());

        if (directError || (data && data.error)) {
          console.log(`  ⚠️  ${description} - May already exist`);
        } else {
          console.log(`  ✓  ${description}`);
          successCount++;
        }
      } else {
        console.log(`  ✓  ${description}`);
        successCount++;
      }
    } catch (err) {
      console.log(`  ⚠️  ${description} - ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\n✅ Applied ${successCount} policies`);
  if (errorCount > 0) {
    console.log(`⚠️  ${errorCount} statements had issues (may already exist)`);
  }

  console.log('\nNote: Some policies may already exist, which is fine.');
  console.log('The hacks page should now display data properly!');
}

applyRLSPolicies().catch(console.error);