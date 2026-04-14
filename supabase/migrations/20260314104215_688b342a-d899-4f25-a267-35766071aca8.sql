
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['application/json', 'text/plain', 'application/octet-stream']
WHERE id = 'retail-datasets';
