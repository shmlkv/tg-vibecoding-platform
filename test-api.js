require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

async function testProjectsAPI() {
  console.log('🔍 Testing projects API...\n');

  const url = process.env.DB_PROJECT_URL;
  const apiKey = process.env.DB_API_KEY;

  const supabase = createClient(url, apiKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // Test 1: Direct query to projects table
    console.log('1️⃣ Querying projects table directly...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (projectsError) {
      console.error('  ❌ Error:', projectsError.message);
      console.error('  Details:', projectsError);

      // Check if table exists
      console.log('\n2️⃣ Checking if projects table exists...');
      const { data: tables, error: tablesError } = await supabase
        .from('projects')
        .select('id')
        .limit(1);

      if (tablesError) {
        console.error('  ❌ Table might not exist:', tablesError.message);
        console.log('\n⚠️  Please run the migration SQL from supabase/migration-projects.sql');
      }
    } else {
      console.log(`  ✅ Success! Found ${projects.length} projects`);

      if (projects.length === 0) {
        console.log('\n⚠️  Table exists but is empty!');
        console.log('Attempting to insert test data...\n');

        // Try to insert test data
        const testProject = {
          title: 'Test Project',
          html_content: '<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello World!</h1></body></html>',
        };

        const { data: inserted, error: insertError } = await supabase
          .from('projects')
          .insert(testProject)
          .select();

        if (insertError) {
          console.error('  ❌ Insert failed:', insertError.message);
          console.error('  Details:', insertError);
        } else {
          console.log('  ✅ Test project inserted successfully!');
          console.log('  Project:', inserted[0]);

          // Query again
          const { data: updatedProjects } = await supabase
            .from('projects')
            .select('*');
          console.log(`\n  Total projects now: ${updatedProjects.length}`);
        }
      } else {
        console.log('\n📋 Projects found:');
        projects.forEach((project, index) => {
          console.log(`\n${index + 1}. [ID: ${project.id}] ${project.title}`);
          console.log(`   HTML length: ${project.html_content?.length || 0} chars`);
          console.log(`   Created: ${project.created_at}`);
        });
      }
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    console.error(error);
  }
}

testProjectsAPI();
