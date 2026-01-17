
-- Function to increment time slot booked count
CREATE OR REPLACE FUNCTION increment_time_slot_booked_count(
  p_booking_date DATE,
  p_time_slot_id UUID,
  p_tenant_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  max_bookings INTEGER;
BEGIN
  -- Get or create the daily time slot status record
  INSERT INTO wash_daily_time_slot_statuses (
    booking_date, 
    time_slot_id, 
    booked_count, 
    max_bookings, 
    tenant_id
  )
  VALUES (
    p_booking_date, 
    p_time_slot_id, 
    1, 
    (SELECT max_bookings FROM wash_time_slots WHERE id = p_time_slot_id),
    p_tenant_id
  )
  ON CONFLICT (booking_date, time_slot_id, tenant_id) 
  DO UPDATE SET booked_count = wash_daily_time_slot_statuses.booked_count + 1
  RETURNING booked_count INTO current_count;

  RETURN current_count < (
    SELECT max_bookings 
    FROM wash_time_slots 
    WHERE id = p_time_slot_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement time slot booked count
CREATE OR REPLACE FUNCTION decrement_time_slot_booked_count(
  p_booking_date DATE,
  p_time_slot_id UUID,
  p_tenant_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
BEGIN
  UPDATE wash_daily_time_slot_statuses
  SET booked_count = GREATEST(booked_count - 1, 0)
  WHERE booking_date = p_booking_date 
    AND time_slot_id = p_time_slot_id 
    AND tenant_id = p_tenant_id
  RETURNING booked_count INTO current_count;

  RETURN current_count >= 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
