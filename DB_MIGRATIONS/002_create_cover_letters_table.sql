-- Create cover_letters table
CREATE TABLE IF NOT EXISTS cover_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'Untitled Cover Letter',
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON cover_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_created_at ON cover_letters(created_at DESC);

-- Migration notes:
-- This table stores multiple cover letters per user (removed UNIQUE constraint)
-- user_id matches the students.id (TEXT field)
-- title field allows users to name their cover letters
-- data column contains: recipientName, recipientTitle, companyName, hireDate, senderFirstName, senderLastName, senderEmail, senderPhone, openingParagraph, bodyParagraphs, closingParagraph
-- RLS is disabled (custom app-level auth is used)
    