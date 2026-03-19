CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMP DEFAULT now()
);