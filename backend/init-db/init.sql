CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS friends (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS group_members (
    id SERIAL PRIMARY KEY,
    group_id INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS group_messages (
    id SERIAL PRIMARY KEY,
    group_id INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (email, password, username) VALUES
('admin@example.com', 'admin_password', 'admin_user'),
('john@example.com', 'john_password', 'john_doe'),
('jane@example.com', 'jane_password', 'jane_doe');

INSERT INTO friends (user_id, friend_id) VALUES
(1, 2),
(1, 3),
(2, 3);

INSERT INTO groups (name) VALUES
('Developers'),
('Designers'),
('Marketers');

INSERT INTO group_members (group_id, user_id) VALUES
(1, 1),
(1, 2),
(2, 3),
(3, 1),
(3, 3);

INSERT INTO messages (sender_id, recipient_id, content) VALUES
(1, 2, 'Hello John!'),
(2, 1, 'Hi Admin, how are you?'),
(3, 1, 'Hey Admin, nice to meet you.');

INSERT INTO group_messages (group_id, sender_id, content) VALUES
(1, 1, 'Welcome to the Developers group!'),
(1, 2, 'Thank you!'),
(2, 3, 'Hello Designers!'),
(3, 1, 'Let’s talk marketing strategies.');




