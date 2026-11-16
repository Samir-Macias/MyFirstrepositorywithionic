-- Add GitHub webhook fields to tasks table for GitHub integration
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS github_pr_number INTEGER,
ADD COLUMN IF NOT EXISTS github_issue_number INTEGER,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS github_updated_at timestamptz;

-- Create indexes for faster lookups during webhook processing
CREATE INDEX IF NOT EXISTS idx_tasks_github_pr_number
  ON public.tasks USING btree (github_pr_number)
  WHERE github_pr_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_github_issue_number
  ON public.tasks USING btree (github_issue_number)
  WHERE github_issue_number IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.tasks.github_pr_number IS 'GitHub Pull Request number for webhook integration';
COMMENT ON COLUMN public.tasks.github_issue_number IS 'GitHub Issue number for webhook integration';
COMMENT ON COLUMN public.tasks.github_url IS 'URL to the GitHub PR or Issue';
COMMENT ON COLUMN public.tasks.github_updated_at IS 'Timestamp of last GitHub webhook update';
