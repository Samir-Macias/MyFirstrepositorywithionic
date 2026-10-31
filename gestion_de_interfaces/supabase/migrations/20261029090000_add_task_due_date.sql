ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS due_date date;

CREATE INDEX IF NOT EXISTS idx_tasks_due_date
  ON public.tasks USING btree (due_date);
