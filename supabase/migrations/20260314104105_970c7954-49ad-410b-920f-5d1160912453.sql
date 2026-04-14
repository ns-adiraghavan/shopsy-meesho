
-- Create public storage bucket for large retail datasets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'retail-datasets',
  'retail-datasets',
  true,
  104857600,
  ARRAY['application/json', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access on retail-datasets"
ON storage.objects FOR SELECT
USING (bucket_id = 'retail-datasets');

-- Allow inserts (upload) — open to service role via edge function
CREATE POLICY "Service role upload access on retail-datasets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'retail-datasets');

-- Allow updates/upserts
CREATE POLICY "Service role update access on retail-datasets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'retail-datasets');
