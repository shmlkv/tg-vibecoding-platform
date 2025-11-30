require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

async function setupProjects() {
  console.log('🔧 Setting up projects table...\n');

  const url = process.env.DB_PROJECT_URL;
  const serviceKey = process.env.DB_SERVICE_KEY || process.env.DB_API_KEY;

  if (!url || !serviceKey) {
    console.error('❌ Missing credentials');
    console.log('\nPlease run the SQL manually from fix-projects-table.sql');
    console.log('Open: https://supabase.com/dashboard/project/ahdimjaaggidcasmfcmu/sql/new');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    console.log('📋 Please run this SQL in Supabase SQL Editor:\n');
    console.log('https://supabase.com/dashboard/project/ahdimjaaggidcasmfcmu/sql/new\n');
    console.log('=' .repeat(80));
    console.log(`
-- Drop and recreate projects table
DROP TABLE IF EXISTS public.projects CASCADE;

CREATE TABLE public.projects (
  id bigserial primary key,
  title text not null,
  description text,
  html_content text not null,
  user_id bigint references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger
DROP TRIGGER IF EXISTS set_updated_at_projects ON public.projects;
CREATE TRIGGER set_updated_at_projects
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Index
CREATE INDEX IF NOT EXISTS idx_projects_user_created_at ON public.projects (user_id, created_at desc);

-- RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Users can insert projects" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update projects" ON public.projects FOR UPDATE USING (true);

-- Test data
INSERT INTO public.projects (title, description, html_content) VALUES
('Test Project', 'Simple test', '<!DOCTYPE html><html><body><h1 style="text-align:center;margin-top:50px;color:#667eea;">Hello from Database!</h1><p style="text-align:center;">This HTML is loaded from Supabase</p></body></html>');
`);
    console.log('=' .repeat(80));
    console.log('\n✅ After running the SQL, your projects will be visible!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setupProjects();
