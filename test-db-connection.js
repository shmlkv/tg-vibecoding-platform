require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

async function testDatabaseConnection() {
  console.log('🔄 Testing database connection...\n');

  // Get credentials from .env
  const url = process.env.DB_PROJECT_URL;
  const apiKey = process.env.DB_API_KEY;

  if (!url || !apiKey) {
    console.error('❌ Missing DB_PROJECT_URL or DB_API_KEY in .env file');
    process.exit(1);
  }

  console.log('✓ Found database credentials');
  console.log(`  URL: ${url}\n`);

  // Create Supabase client
  const supabase = createClient(url, apiKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // Test 1: Check if we can query existing tables
    console.log('1️⃣ Testing connection with posts table...');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, title')
      .limit(5);

    if (postsError) {
      console.error('  ❌ Error querying posts:', postsError.message);
    } else {
      console.log(`  ✓ Successfully connected! Found ${posts.length} posts`);
      if (posts.length > 0) {
        console.log('  Sample post:', posts[0]);
      }
    }

    // Test 2: Try to query projects table
    console.log('\n2️⃣ Checking for projects table...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(5);

    if (projectsError) {
      console.error('  ❌ Projects table not found or error:', projectsError.message);
      console.log('  ℹ️  You may need to create the projects table first');
    } else {
      console.log(`  ✓ Projects table exists! Found ${projects.length} projects`);
      if (projects.length > 0) {
        console.log('  Sample project:', projects[0]);
      }
    }

    // Test 3: List all tables (using raw SQL)
    console.log('\n3️⃣ Listing all tables in public schema...');
    const { data: tables, error: tablesError } = await supabase.rpc('get_tables');

    if (tablesError) {
      // Alternative method to list tables
      console.log('  ℹ️  Attempting alternative method...');
      const { data: altTables, error: altError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (altError) {
        console.log('  ⚠️  Cannot list tables directly, but connection works');
      }
    } else {
      console.log('  Available tables:', tables);
    }

    console.log('\n✅ Database connection test completed!');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

testDatabaseConnection();
