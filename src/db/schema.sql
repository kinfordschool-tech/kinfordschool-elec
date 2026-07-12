-- Drop tables if they exist (for a clean reset/initialization)
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS voters CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS positions CASCADE;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Positions table
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    order_index INT NOT NULL UNIQUE
);

-- 2. Candidates table
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    photo_url TEXT NOT NULL,
    manifesto TEXT NOT NULL,
    vote_count INT NOT NULL DEFAULT 0
);

-- 3. Voters table
CREATE TABLE voters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    access_code TEXT UNIQUE NOT NULL,
    has_voted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 4. Votes table
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_candidates_position_id ON candidates(position_id);
CREATE INDEX idx_votes_position_id ON votes(position_id);
CREATE INDEX idx_voters_access_code ON voters(access_code);

-- Insert default positions
INSERT INTO positions (name, order_index) VALUES
('Chairperson', 1),
('General Secretary', 2),
('Fine Arts Secretary', 3),
('Students'' Editor', 4),
('General Captain', 5);
