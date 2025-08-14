-- Next Holiday Database Schema
-- PostgreSQL 15+ compatible
-- Target: AWS RDS/Aurora PostgreSQL

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types/enums
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE rsvp_status AS ENUM ('pending', 'confirmed', 'declined', 'maybe');
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'member');

-- Users table (Auth0 integration)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth0_sub TEXT UNIQUE NOT NULL,
    email TEXT,
    name TEXT,
    picture TEXT,
    is_in_db BOOLEAN DEFAULT false,
    is_first_login BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Accounts table (multi-tenant households/families)
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Account members (many-to-many relationship)
CREATE TABLE account_members (
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role member_role DEFAULT 'member',
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (account_id, user_id)
);

-- Holidays table
CREATE TABLE holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    holiday_type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    color_light TEXT,
    color_dark TEXT,
    is_custom BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contacts table (address book)
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    street_address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    relationship TEXT,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_id UUID NOT NULL REFERENCES holidays(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority task_priority DEFAULT 'medium',
    category TEXT,
    is_completed BOOLEAN DEFAULT false,
    completed_date TIMESTAMPTZ,
    due_date DATE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    share_id UUID, -- Will be FK after shares table is created
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Task assignees (many-to-many relationship)
CREATE TABLE task_assignees (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, user_id)
);

-- Gifts table
CREATE TABLE gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_id UUID NOT NULL REFERENCES holidays(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    actual_price NUMERIC(12,2),
    store TEXT,
    product_link TEXT,
    notes TEXT,
    is_completed BOOLEAN DEFAULT false,
    completed_date TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    share_id UUID, -- Will be FK after shares table is created
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Cards table
CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_id UUID NOT NULL REFERENCES holidays(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    recipient TEXT NOT NULL,
    address TEXT,
    message TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    sent_date TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    share_id UUID, -- Will be FK after shares table is created
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Budgets table
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_id UUID NOT NULL REFERENCES holidays(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    total_budget NUMERIC(12,2) NOT NULL DEFAULT 0,
    spent_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    remaining_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Budget transactions table
CREATE TABLE budget_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    amount NUMERIC(12,2) NOT NULL,
    category TEXT NOT NULL,
    transaction_date DATE NOT NULL,
    is_expense BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Shares table (holiday sharing)
CREATE TABLE shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_id UUID NOT NULL REFERENCES holidays(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (holiday_id)
);

-- Share members (many-to-many relationship)
CREATE TABLE share_members (
    share_id UUID NOT NULL REFERENCES shares(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT now(),
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    PRIMARY KEY (share_id, user_id)
);

-- Invites table
CREATE TABLE invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id UUID NOT NULL REFERENCES shares(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    to_email TEXT,
    holiday_key TEXT NOT NULL,
    status invite_status DEFAULT 'pending',
    message TEXT,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Kwanzaa principles table (specialized)
CREATE TABLE kwanzaa_principles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_id UUID NOT NULL REFERENCES holidays(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 7),
    name TEXT NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (holiday_id, day_number)
);

-- Guest lists table
CREATE TABLE guest_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_id UUID NOT NULL REFERENCES holidays(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    rsvp_status rsvp_status DEFAULT 'pending',
    rsvp_date TIMESTAMPTZ,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (holiday_id, contact_id)
);

-- Audit log table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Now add the missing foreign key constraints
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_share_id FOREIGN KEY (share_id) REFERENCES shares(id) ON DELETE SET NULL;
ALTER TABLE gifts ADD CONSTRAINT fk_gifts_share_id FOREIGN KEY (share_id) REFERENCES shares(id) ON DELETE SET NULL;
ALTER TABLE cards ADD CONSTRAINT fk_cards_share_id FOREIGN KEY (share_id) REFERENCES shares(id) ON DELETE SET NULL;

-- Create indexes for performance
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth0_sub ON users(auth0_sub);

-- Accounts
CREATE INDEX idx_accounts_owner_user_id ON accounts(owner_user_id);

-- Account members
CREATE INDEX idx_account_members_user_id ON account_members(user_id);
CREATE INDEX idx_account_members_account_id ON account_members(account_id);

-- Holidays
CREATE INDEX idx_holidays_account_id ON holidays(account_id);
CREATE INDEX idx_holidays_account_type ON holidays(account_id, holiday_type);
CREATE INDEX idx_holidays_start_date ON holidays(start_date);
CREATE INDEX idx_holidays_is_custom ON holidays(is_custom);
CREATE INDEX idx_holidays_created_by ON holidays(created_by);

-- Contacts
CREATE INDEX idx_contacts_account_id ON contacts(account_id);
CREATE INDEX idx_contacts_name ON contacts(name);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_created_by ON contacts(created_by);

-- Tasks
CREATE INDEX idx_tasks_holiday_id ON tasks(holiday_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_is_completed ON tasks(is_completed);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_share_id ON tasks(share_id);
CREATE INDEX idx_tasks_open ON tasks(holiday_id) WHERE is_completed = false;

-- Task assignees
CREATE INDEX idx_task_assignees_user_id ON task_assignees(user_id);

-- Gifts
CREATE INDEX idx_gifts_holiday_id ON gifts(holiday_id);
CREATE INDEX idx_gifts_contact_id ON gifts(contact_id);
CREATE INDEX idx_gifts_is_completed ON gifts(is_completed);
CREATE INDEX idx_gifts_price ON gifts(price);
CREATE INDEX idx_gifts_created_by ON gifts(created_by);
CREATE INDEX idx_gifts_share_id ON gifts(share_id);

-- Cards
CREATE INDEX idx_cards_holiday_id ON cards(holiday_id);
CREATE INDEX idx_cards_contact_id ON cards(contact_id);
CREATE INDEX idx_cards_is_completed ON cards(is_completed);
CREATE INDEX idx_cards_created_by ON cards(created_by);
CREATE INDEX idx_cards_share_id ON cards(share_id);

-- Budgets
CREATE INDEX idx_budgets_holiday_id ON budgets(holiday_id);
CREATE INDEX idx_budgets_created_by ON budgets(created_by);
CREATE INDEX idx_budgets_date_range ON budgets(start_date, end_date);

-- Budget transactions
CREATE INDEX idx_budget_transactions_budget_id ON budget_transactions(budget_id);
CREATE INDEX idx_budget_transactions_category ON budget_transactions(category);
CREATE INDEX idx_budget_transactions_date ON budget_transactions(transaction_date);
CREATE INDEX idx_budget_transactions_created_by ON budget_transactions(created_by);

-- Shares
CREATE INDEX idx_shares_owner_user_id ON shares(owner_user_id);

-- Share members
CREATE INDEX idx_share_members_user_id ON share_members(user_id);
CREATE INDEX idx_share_members_share_id ON share_members(share_id);

-- Invites
CREATE INDEX idx_invites_to_email ON invites(to_email);
CREATE INDEX idx_invites_status ON invites(status);
CREATE INDEX idx_invites_share_id ON invites(share_id);
CREATE INDEX idx_invites_from_user_id ON invites(from_user_id);
CREATE INDEX idx_invites_to_user_id ON invites(to_user_id);

-- Kwanzaa principles
CREATE INDEX idx_kwanzaa_principles_is_completed ON kwanzaa_principles(is_completed);

-- Guest lists
CREATE INDEX idx_guest_lists_rsvp_status ON guest_lists(rsvp_status);

-- Audit log
CREATE INDEX idx_audit_log_account_id ON audit_log(account_id, created_at);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id, created_at);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_holidays_updated_at BEFORE UPDATE ON holidays FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gifts_updated_at BEFORE UPDATE ON gifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_transactions_updated_at BEFORE UPDATE ON budget_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shares_updated_at BEFORE UPDATE ON shares FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kwanzaa_principles_updated_at BEFORE UPDATE ON kwanzaa_principles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guest_lists_updated_at BEFORE UPDATE ON guest_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update budget amounts
CREATE OR REPLACE FUNCTION update_budget_amounts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update spent_amount and remaining_amount in budgets table
    UPDATE budgets 
    SET 
        spent_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM budget_transactions 
            WHERE budget_id = NEW.budget_id AND is_expense = true
        ),
        remaining_amount = total_budget - (
            SELECT COALESCE(SUM(amount), 0)
            FROM budget_transactions 
            WHERE budget_id = NEW.budget_id AND is_expense = true
        ),
        updated_at = now()
    WHERE id = NEW.budget_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for budget amount updates
CREATE TRIGGER update_budget_amounts_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON budget_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_budget_amounts();

-- Add comments for documentation
COMMENT ON TABLE users IS 'Auth0 user accounts with profile information';
COMMENT ON TABLE accounts IS 'Multi-tenant households/families for collaboration';
COMMENT ON TABLE account_members IS 'Many-to-many relationship between users and accounts';
COMMENT ON TABLE holidays IS 'Holiday instances with metadata and configuration';
COMMENT ON TABLE contacts IS 'Address book entries for gift recipients, card recipients, etc.';
COMMENT ON TABLE tasks IS 'Generic and holiday-specific tasks with priorities and assignments';
COMMENT ON TABLE task_assignees IS 'Many-to-many relationship for task assignments';
COMMENT ON TABLE gifts IS 'Gift lists with recipients, prices, and purchase tracking';
COMMENT ON TABLE cards IS 'Greeting cards with recipients and sending status';
COMMENT ON TABLE budgets IS 'Budget tracking for holidays with spending limits';
COMMENT ON TABLE budget_transactions IS 'Individual budget line items and expenses';
COMMENT ON TABLE shares IS 'Holiday sharing for multi-user collaboration';
COMMENT ON TABLE share_members IS 'Many-to-many relationship for share membership';
COMMENT ON TABLE invites IS 'Invitation system for holiday sharing';
COMMENT ON TABLE kwanzaa_principles IS 'Special daily principle tracking for Kwanzaa';
COMMENT ON TABLE guest_lists IS 'Guest lists for events and parties with RSVP tracking';
COMMENT ON TABLE audit_log IS 'Activity tracking for debugging and compliance';

-- Grant permissions (adjust as needed for your deployment)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
