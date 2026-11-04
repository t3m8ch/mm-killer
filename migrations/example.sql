CREATE TABLE IF NOT EXISTS example_entries (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  text text NOT NULL CHECK (length(text) BETWEEN 1 AND 200),
  created_at timestamptz NOT NULL
);
