require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

async function checkProjectsStructure() {
  console.log('🔍 Checking projects table structure...\n');

  const url = process.env.DB_PROJECT_URL;
  const apiKey = process.env.DB_API_KEY;

  const supabase = createClient(url, apiKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // Try to select all columns from projects (will show us what columns exist)
    console.log('1️⃣ Attempting to query projects table...');
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .limit(1);

    if (error) {
      console.error('  ❌ Error:', error.message);
      return;
    }

    console.log('  ✓ Query successful!');
    console.log('  Number of records:', data.length);

    if (data.length > 0) {
      console.log('\n2️⃣ Table structure (columns found):');
      const columns = Object.keys(data[0]);
      columns.forEach(col => {
        console.log(`  - ${col}: ${typeof data[0][col]}`);
      });

      console.log('\n3️⃣ Sample data:');
      console.log(JSON.stringify(data[0], null, 2));

      // Check for html_content specifically
      if (columns.includes('html_content')) {
        console.log('\n✅ html_content column EXISTS!');
      } else {
        console.log('\n⚠️  html_content column NOT FOUND!');
        console.log('Available columns:', columns);
      }
    } else {
      console.log('\n⚠️  Table is empty - cannot determine structure from data');
      console.log('Attempting to insert a test record to discover structure...\n');

      // Try inserting a minimal record to see what columns are required
      const { error: insertError } = await supabase
        .from('projects')
        .insert({
          title: 'Test Project',
          html_content: '<h1>Test HTML</h1><p>This is a test project.</p>',
        })
        .select();

      if (insertError) {
        console.log('❌ Insert failed:', insertError.message);
        console.log('This tells us about the table structure requirements.');

        // Try a different structure
        console.log('\nTrying alternative structure...');
        const { data: altData, error: altError } = await supabase
          .from('projects')
          .insert({
            name: 'Test Project',
            html_content: '<h1>Test HTML</h1>',
          })
          .select();

        if (altError) {
          console.log('❌ Alternative insert also failed:', altError.message);
        } else {
          console.log('✅ Alternative structure worked!');
          console.log('Inserted record:', altData);
        }
      } else {
        console.log('✅ Successfully inserted test record!');
        console.log('This means the table accepts: title and html_content');

        // Now query it again
        const { data: newData } = await supabase
          .from('projects')
          .select('*')
          .limit(1);

        if (newData && newData.length > 0) {
          console.log('\n📋 Full table structure:');
          Object.keys(newData[0]).forEach(col => {
            console.log(`  - ${col}`);
          });
        }
      }
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
  }
}

checkProjectsStructure();
