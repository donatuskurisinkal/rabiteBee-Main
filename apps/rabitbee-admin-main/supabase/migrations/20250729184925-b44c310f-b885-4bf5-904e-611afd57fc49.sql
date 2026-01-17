-- Add viewed status to support tickets
ALTER TABLE public.support_tickets 
ADD COLUMN is_viewed BOOLEAN NOT NULL DEFAULT false;

-- Add an index for better performance on ordering
CREATE INDEX idx_support_tickets_status_priority_created 
ON public.support_tickets (is_viewed, priority, created_at DESC);