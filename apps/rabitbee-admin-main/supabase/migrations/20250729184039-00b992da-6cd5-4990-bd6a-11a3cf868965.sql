-- Insert a sample support ticket for testing
INSERT INTO public.support_tickets (
  user_id,
  tenant_id,
  user_role,
  issue_category,
  subject,
  description,
  attachments,
  status,
  priority,
  created_at
) VALUES (
  (SELECT id FROM auth.users LIMIT 1), -- Use the first available user
  (SELECT id FROM public.tenants LIMIT 1), -- Use the first available tenant
  'customer',
  'payment_issue',
  'Payment deducted but order not placed',
  'I made a payment of ₹450 for order #ORD1234 but the order was not placed successfully. The money has been deducted from my account but I did not receive any confirmation. Please help me resolve this issue urgently as I need the food delivered for an important meeting.',
  '[]'::jsonb,
  'new',
  'high',
  now() - interval '2 hours'
);