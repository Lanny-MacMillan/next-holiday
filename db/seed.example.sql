-- Next Holiday Database Seed Data
-- Sample data for testing and development

-- Sample users (Auth0 integration)
INSERT INTO users (id, auth0_sub, email, name, is_in_db, is_first_login) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'auth0|user1', 'john.doe@example.com', 'John Doe', true, false),
('550e8400-e29b-41d4-a716-446655440002', 'auth0|user2', 'jane.smith@example.com', 'Jane Smith', true, false);

-- Sample accounts
INSERT INTO accounts (id, name, owner_user_id) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Doe Family', '550e8400-e29b-41d4-a716-446655440001'),
('660e8400-e29b-41d4-a716-446655440002', 'Smith Family', '550e8400-e29b-41d4-a716-446655440002');

-- Sample holidays
INSERT INTO holidays (id, account_id, holiday_type, name, start_date, created_by) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'christmas', 'Christmas 2024', '2024-12-25', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'thanksgiving', 'Thanksgiving 2024', '2024-11-28', '550e8400-e29b-41d4-a716-446655440002');

-- Sample contacts
INSERT INTO contacts (id, account_id, name, email, relationship, created_by) VALUES
('880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Mom Doe', 'mom.doe@example.com', 'Mother', '550e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'Grandma Smith', 'grandma.smith@example.com', 'Grandmother', '550e8400-e29b-41d4-a716-446655440002');

-- Sample tasks
INSERT INTO tasks (id, holiday_id, title, priority, is_completed, created_by) VALUES
('990e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'Buy Christmas tree', 'high', false, '550e8400-e29b-41d4-a716-446655440001'),
('990e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', 'Buy turkey', 'high', false, '550e8400-e29b-41d4-a716-446655440002');

-- Sample gifts
INSERT INTO gifts (id, holiday_id, contact_id, name, price, is_completed, created_by) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 'Wireless Headphones', 199.99, false, '550e8400-e29b-41d4-a716-446655440001');

-- Sample budgets
INSERT INTO budgets (id, holiday_id, name, total_budget, created_by) VALUES
('cc0e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 'Thanksgiving Budget', 300.00, '550e8400-e29b-41d4-a716-446655440002');

-- Sample budget transactions
INSERT INTO budget_transactions (id, budget_id, name, amount, category, transaction_date, created_by) VALUES
('dd0e8400-e29b-41d4-a716-446655440001', 'cc0e8400-e29b-41d4-a716-446655440001', 'Turkey', 45.99, 'Food & Ingredients', '2024-11-26', '550e8400-e29b-41d4-a716-446655440002');

-- Sample shares
INSERT INTO shares (id, holiday_id, owner_user_id) VALUES
('ee0e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001');

-- Sample Kwanzaa principles
INSERT INTO kwanzaa_principles (id, holiday_id, day_number, name, is_completed) VALUES
('gg0e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 1, 'Umoja (Unity)', false),
('gg0e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', 2, 'Kujichagulia (Self-Determination)', false);
