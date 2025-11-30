require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

async function getTableColumns() {
  console.log('🔍 Getting table columns via direct query...\n');

  const url = process.env.DB_PROJECT_URL;
  const apiKey = process.env.DB_API_KEY;

  const supabase = createClient(url, apiKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // First, let's just try to insert a record with html_content
    console.log('1️⃣ Testing if html_content column exists by inserting data...');

    const testProject = {
      html_content: '<html><body><h1>Test Project</h1><p>Sample content</p></body></html>',
    };

    const { data: insertData, error: insertError } = await supabase
      .from('projects')
      .insert(testProject)
      .select();

    if (insertError) {
      console.log('  ❌ Insert with only html_content failed:', insertError.message);
      console.log('  This suggests the table requires other fields\n');

      // Try with an id
      console.log('2️⃣ Trying with an id field...');
      const { data: data2, error: error2 } = await supabase
        .from('projects')
        .insert({
          id: crypto.randomUUID(),
          html_content: '<html><body><h1>Test</h1></body></html>',
        })
        .select();

      if (error2) {
        console.log('  ❌ Still failed:', error2.message, '\n');
      } else {
        console.log('  ✅ Success with id! Data:', data2);
      }
    } else {
      console.log('  ✅ Insert successful! Data:', insertData);
      console.log('\n📋 Table structure (from inserted data):');
      if (insertData && insertData[0]) {
        Object.keys(insertData[0]).forEach(col => {
          console.log(`  - ${col}`);
        });
      }
    }

    // Now let's query what we have
    console.log('\n3️⃣ Querying all projects...');
    const { data: allProjects, error: queryError } = await supabase
      .from('projects')
      .select('*');

    if (queryError) {
      console.log('  ❌ Query failed:', queryError.message);
    } else {
      console.log(`  ✅ Found ${allProjects.length} projects`);
      if (allProjects.length > 0) {
        console.log('\n  First project structure:');
        const firstProject = allProjects[0];
        Object.entries(firstProject).forEach(([key, value]) => {
          const preview = typeof value === 'string' && value.length > 50
            ? value.substring(0, 50) + '...'
            : value;
          console.log(`  - ${key}: ${preview}`);
        });

        // Check if html_content exists and has data
        if ('html_content' in firstProject) {
          console.log('\n  ✅ html_content column confirmed!');
          console.log(`  HTML length: ${firstProject.html_content?.length || 0} characters`);
        }
      }
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
  }
}

getTableColumns();
