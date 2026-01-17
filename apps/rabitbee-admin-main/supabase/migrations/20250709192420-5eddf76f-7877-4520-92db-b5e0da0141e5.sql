
-- Update the function to generate shorter order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
    order_number text;
BEGIN
    -- Generate shorter order number: ORD + MMDD + 3-digit random
    order_number := 'ORD' || to_char(now(), 'MMDD') || 
                   LPAD(floor(random() * 1000)::text, 3, '0');
    RETURN order_number;
END;
$$ LANGUAGE plpgsql;

-- Update all existing orders with new shorter order numbers
UPDATE orders SET orderno = generate_order_number();
