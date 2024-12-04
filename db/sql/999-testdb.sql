-- ============== TEST SETUP ==============

-- Create a new role for the test user
CREATE ROLE test_user WITH LOGIN PASSWORD 'test_pwd';

-- Create a new database for the test user
CREATE DATABASE test WITH OWNER = postgres TEMPLATE = postgres;

-- Grant all privileges on the test database to the test user
GRANT ALL PRIVILEGES ON DATABASE test TO test_user;

-- Only allow the test user to connect to the test database
REVOKE CONNECT ON DATABASE postgres FROM test_user;
