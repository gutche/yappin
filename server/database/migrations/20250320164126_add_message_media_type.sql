-- migrate:up
ALTER TABLE messages 
ADD COLUMN media_url TEXT NULL,
ADD COLUMN media_type VARCHAR(10) NULL; -- 'video', 'audio', 'image'

-- migrate:down
ALTER TABLE messages 
DROP COLUMN media_url,
DROP COLUMN media_type;
