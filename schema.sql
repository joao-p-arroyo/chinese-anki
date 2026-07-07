-- schema.sql
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password_hash TEXT,
    settings TEXT
);

CREATE TABLE IF NOT EXISTS progress (
    user_id TEXT,
    char_id TEXT,
    ease_factor REAL DEFAULT 2.5,
    repetition INTEGER DEFAULT 0,
    interval INTEGER DEFAULT 0,
    next_review TEXT,
    dont_know_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, char_id)
);
