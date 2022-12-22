-- Init file
SET TIMEZONE = 'Asia/Shanghai';

DROP TABLE IF EXISTS song CASCADE;

CREATE TABLE song(
	id SERIAL PRIMARY KEY,
  belongs_to_user VARCHAR(30),
	title VARCHAR(100), 
  sang boolean DEFAULT false,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TABLE IF EXISTS gift CASCADE;

CREATE TABLE gift(
  id SERIAL PRIMARY KEY,
  belongs_to_user VARCHAR(30),
  gift_id INT,
  gift_count INT,
  expired BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TABLE IF EXISTS superchat CASCADE;

CREATE TABLE superchat(
  id SERIAL PRIMARY KEY,
  belongs_to_user VARCHAR(30),
  avatar VARCHAR(100),
  total_price FLOAT,
  text VARCHAR(100),
  expired BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
