-- Run this entire script in your Supabase SQL Editor (Dashboard > SQL Editor)
-- Creates all tables for team collaboration features

-- 1. Project Members
CREATE TABLE IF NOT EXISTS project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- 2. Project Invites
CREATE TABLE IF NOT EXISTS project_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('editor', 'viewer')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  accepted BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ DEFAULT now() + interval '7 days',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Task Comments
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Activity Log
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Add assignee to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES auth.users(id);

-- 7. Add avatar_url to profiles (if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Enable Row Level Security
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_members
DROP POLICY IF EXISTS "members_select" ON project_members;
CREATE POLICY "members_select" ON project_members FOR SELECT USING (
  user_id = auth.uid() OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "members_insert" ON project_members;
CREATE POLICY "members_insert" ON project_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
);

-- RLS Policies for project_invites
DROP POLICY IF EXISTS "invites_select" ON project_invites;
CREATE POLICY "invites_select" ON project_invites FOR SELECT USING (
  invited_by = auth.uid() OR email = auth.email() OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "invites_insert" ON project_invites;
CREATE POLICY "invites_insert" ON project_invites FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
);

-- RLS Policies for task_comments
DROP POLICY IF EXISTS "comments_select" ON task_comments;
CREATE POLICY "comments_select" ON task_comments FOR SELECT USING (
  task_id IN (SELECT id FROM tasks WHERE project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS "comments_insert" ON task_comments;
CREATE POLICY "comments_insert" ON task_comments FOR INSERT WITH CHECK (
  user_id = auth.uid() AND task_id IN (SELECT id FROM tasks WHERE project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()))
);

-- RLS Policies for activity_log
DROP POLICY IF EXISTS "activity_select" ON activity_log;
CREATE POLICY "activity_select" ON activity_log FOR SELECT USING (
  project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "activity_insert" ON activity_log;
CREATE POLICY "activity_insert" ON activity_log FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for notifications
DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Update projects table RLS to allow members to see projects
DROP POLICY IF EXISTS "projects_select" ON projects;
CREATE POLICY "projects_select" ON projects FOR SELECT USING (
  owner_id = auth.uid() OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
);

-- 8. Task Attachments
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  file_name TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attachments_select" ON task_attachments;
CREATE POLICY "attachments_select" ON task_attachments FOR SELECT USING (
  task_id IN (SELECT id FROM tasks WHERE project_id IN (
    SELECT project_id FROM project_members WHERE user_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "attachments_insert" ON task_attachments;
CREATE POLICY "attachments_insert" ON task_attachments FOR INSERT WITH CHECK (
  user_id = auth.uid() AND task_id IN (SELECT id FROM tasks WHERE project_id IN (
    SELECT project_id FROM project_members WHERE user_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "attachments_delete" ON task_attachments;
CREATE POLICY "attachments_delete" ON task_attachments FOR DELETE USING (user_id = auth.uid());
