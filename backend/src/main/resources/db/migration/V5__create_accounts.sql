CREATE TABLE accounts (
    account_id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT accounts_role_valid CHECK (role IN ('CUSTOMER', 'ADMIN'))
);

-- Emails are compared case-insensitively; the application stores them lower-cased.
CREATE UNIQUE INDEX accounts_email_unique ON accounts (lower(email));
