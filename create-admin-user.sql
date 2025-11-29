-- Create admin user in Supabase Auth
-- Run this in Supabase SQL Editor

-- First, create the user (if not exists)
-- Note: You need to create the user through Supabase Dashboard → Authentication → Users → Add User
-- OR use the Supabase Auth API

-- After creating the user, you can update the password with:
-- UPDATE auth.users SET encrypted_password = crypt('Piksel2024!Admin', gen_salt('bf')) WHERE email = 'admin@piksel.lt';

-- However, the easiest way is to:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User" or find existing admin@piksel.lt
-- 3. Set email: admin@piksel.lt
-- 4. Set password: Piksel2024!Admin
-- 5. Uncheck "Auto Confirm User" if you want to manually confirm
-- 6. Click "Create User"

-- Alternative: Use Supabase Management API or CLI to create user

