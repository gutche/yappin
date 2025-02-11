-- migrate:up
-- Add `is_anonymous` column
ALTER TABLE users ADD COLUMN is_anonymous BOOLEAN NOT NULL DEFAULT FALSE;

-- Create a unique index for anonymous usernames only
CREATE UNIQUE INDEX unique_anonymous_username ON users (username) WHERE is_anonymous = TRUE;

-- Create function to generate unique anonymous usernames
CREATE OR REPLACE FUNCTION generate_unique_anonymous_username() 
RETURNS TRIGGER AS $$
DECLARE
    new_username TEXT;
BEGIN
    IF NEW.is_anonymous THEN
        LOOP
            new_username := 'anon_' || LPAD(TRUNC(RANDOM() * 1000000)::TEXT, 6, '0');
            EXIT WHEN NOT EXISTS (SELECT 1 FROM users WHERE username = new_username AND is_anonymous = TRUE);
        END LOOP;
        NEW.username := new_username;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for generating anonymous usernames
CREATE TRIGGER ensure_unique_anonymous_username
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION generate_unique_anonymous_username();


-- migrate:down
-- Remove the trigger
DROP TRIGGER IF EXISTS ensure_unique_anonymous_username ON users;

-- Remove the function
DROP FUNCTION IF EXISTS generate_unique_anonymous_username;

-- Remove the unique index
DROP INDEX IF EXISTS unique_anonymous_username;

-- Remove `is_anonymous` column
ALTER TABLE users DROP COLUMN IF EXISTS is_anonymous;

