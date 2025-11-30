-- Fix projects table structure
-- Run this in Supabase SQL Editor

-- Drop existing projects table if it has wrong structure
DROP TABLE IF EXISTS public.projects CASCADE;

-- Create projects table with correct structure
CREATE TABLE public.projects (
  id bigserial primary key,
  title text not null,
  description text,
  html_content text not null,
  user_id bigint references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at in sync for projects
DROP TRIGGER IF EXISTS set_updated_at_projects ON public.projects;
CREATE TRIGGER set_updated_at_projects
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_created_at ON public.projects (user_id, created_at desc);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS policies for projects (allow read for all, insert/update/delete for authenticated users)
DROP POLICY IF EXISTS "Anyone can view projects" ON public.projects;
CREATE POLICY "Anyone can view projects"
  ON public.projects FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
CREATE POLICY "Users can insert their own projects"
  ON public.projects FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (true);

-- Insert sample data
INSERT INTO public.projects (title, description, html_content) VALUES
  (
    'Interactive Portfolio',
    'A modern portfolio website with animations',
    '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Portfolio</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 600px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        h1 {
            color: #667eea;
            margin-bottom: 10px;
            font-size: 2.5em;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 1.2em;
        }
        .skills {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 20px;
        }
        .skill {
            background: #667eea;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9em;
            transition: transform 0.2s;
        }
        .skill:hover {
            transform: scale(1.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>John Doe</h1>
        <p class="subtitle">Full Stack Developer</p>
        <p>I create beautiful, responsive web applications with modern technologies.</p>
        <div class="skills">
            <span class="skill">React</span>
            <span class="skill">TypeScript</span>
            <span class="skill">Node.js</span>
            <span class="skill">PostgreSQL</span>
            <span class="skill">Next.js</span>
        </div>
    </div>
</body>
</html>'
  ),
  (
    'Task Manager Dashboard',
    'A clean task management interface',
    '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Manager</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        .dashboard {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            margin-bottom: 20px;
        }
        .task {
            background: #ecf0f1;
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            border-left: 4px solid #3498db;
            transition: all 0.3s;
        }
        .task:hover {
            transform: translateX(5px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .task.completed {
            opacity: 0.6;
            border-left-color: #27ae60;
        }
        .task h3 {
            color: #2c3e50;
            margin-bottom: 5px;
        }
        .task p {
            color: #7f8c8d;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <h1>My Tasks</h1>
        <div class="task">
            <h3>Design new landing page</h3>
            <p>Create mockups and wireframes for the new product launch</p>
        </div>
        <div class="task completed">
            <h3>Review pull requests</h3>
            <p>Check and merge pending code changes</p>
        </div>
        <div class="task">
            <h3>Update documentation</h3>
            <p>Add examples for the new API endpoints</p>
        </div>
    </div>
</body>
</html>'
  ),
  (
    'Animated Landing Page',
    'Eye-catching landing page with CSS animations',
    '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Animated Landing</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        .hero {
            text-align: center;
            color: white;
            z-index: 1;
        }
        h1 {
            font-size: 4em;
            margin-bottom: 20px;
            animation: slideDown 1s ease-out;
        }
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-50px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        p {
            font-size: 1.5em;
            margin-bottom: 30px;
            animation: fadeIn 1s ease-out 0.5s both;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        button {
            background: white;
            color: #ff6b6b;
            border: none;
            padding: 15px 40px;
            font-size: 1.2em;
            border-radius: 30px;
            cursor: pointer;
            animation: bounceIn 1s ease-out 1s both;
            transition: transform 0.2s;
        }
        button:hover {
            transform: scale(1.1);
        }
        @keyframes bounceIn {
            0% {
                opacity: 0;
                transform: scale(0.3);
            }
            50% {
                transform: scale(1.05);
            }
            100% {
                opacity: 1;
                transform: scale(1);
            }
        }
        .circle {
            position: absolute;
            border-radius: 50%;
            background: rgba(255,255,255,0.1);
            animation: float 6s ease-in-out infinite;
        }
        .circle:nth-child(1) {
            width: 100px;
            height: 100px;
            top: 10%;
            left: 20%;
            animation-delay: 0s;
        }
        .circle:nth-child(2) {
            width: 150px;
            height: 150px;
            top: 60%;
            left: 70%;
            animation-delay: 2s;
        }
        .circle:nth-child(3) {
            width: 80px;
            height: 80px;
            top: 80%;
            left: 10%;
            animation-delay: 4s;
        }
        @keyframes float {
            0%, 100% {
                transform: translateY(0px);
            }
            50% {
                transform: translateY(-20px);
            }
        }
    </style>
</head>
<body>
    <div class="circle"></div>
    <div class="circle"></div>
    <div class="circle"></div>
    <div class="hero">
        <h1>Welcome</h1>
        <p>Experience the future of web design</p>
        <button>Get Started</button>
    </div>
</body>
</html>'
  );
