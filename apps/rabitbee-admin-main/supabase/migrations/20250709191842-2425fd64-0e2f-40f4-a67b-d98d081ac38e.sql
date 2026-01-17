
-- Add orderno column to orders table
ALTER TABLE orders ADD COLUMN orderno text;

-- Create a function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
    order_number text;
BEGIN
    -- Generate order number using timestamp and random suffix
    order_number := 'ORD' || to_char(now(), 'YYYYMMDD') || '-' || 
                   LPAD(floor(random() * 10000)::text, 4, '0');
    RETURN order_number;
END;
$$ LANGUAGE plpgsql;

-- Update existing orders with order numbers
UPDATE orders SET orderno = generate_order_number() WHERE orderno IS NULL;

-- Add trigger to auto-generate order numbers for new orders
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.orderno IS NULL THEN
        NEW.orderno := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_number();
