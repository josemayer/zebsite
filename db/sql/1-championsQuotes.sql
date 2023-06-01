CREATE TABLE champions_quotes (
    id SERIAL PRIMARY KEY,
    quote character varying(255) NOT NULL UNIQUE,
    champion character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

INSERT INTO champions_quotes (quote, champion) VALUES
  ('The cycle of life and death continues. We will live, they will die.', 'Nasus'),
  ('Time for a true display of skill!', 'Ezreal'),
  ('Hut, two, three, four!', 'Teemo'),
  ('Precision is the difference between a butcher and a surgeon.', 'Camille'),
  ('By my will, this shall be finished.', 'Jarvan IV'),
  ('Never one... without the other.', 'Kindred'),
  ('Who wants a piece of the champ?', 'Jax'),
  ('I will be the best.', 'Wukong'),
  ('One step ahead of the past.', 'Yasuo'),
  ('I fight, until the blood takes the spear from my grasp, until I can only crawl.', 'Pantheon'),
  ('Never play fair', 'Katarina');

-- Alter the sequence to start at the last inserted ID
ALTER SEQUENCE champions_quotes_id_seq RESTART WITH 11;
