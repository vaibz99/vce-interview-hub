
-- Create interviews table
CREATE TABLE public.interviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  role TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Software' CHECK (category IN ('Software', 'Core ECE', 'Management')),
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_dump TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view)
CREATE POLICY "Anyone can view interviews"
  ON public.interviews FOR SELECT
  USING (true);

-- Only authenticated users can insert
CREATE POLICY "Authenticated users can insert interviews"
  ON public.interviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
