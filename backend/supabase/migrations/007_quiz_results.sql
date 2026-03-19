CREATE TABLE quiz_results (
  id SERIAL PRIMARY KEY,
  quiz_id INT,
  user_id uuid,
  score INT
);