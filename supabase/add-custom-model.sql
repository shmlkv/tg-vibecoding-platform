-- Add custom_model column to user_settings table
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS custom_model TEXT DEFAULT NULL;

-- Comment for documentation
COMMENT ON COLUMN user_settings.custom_model IS 'Custom OpenRouter model ID entered by user';
