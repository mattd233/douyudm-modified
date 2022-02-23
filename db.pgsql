DROP TABLE IF EXISTS diange CASCADE;

CREATE TABLE diange(
	id SERIAL PRIMARY KEY,
  bl SMALLINT,
  nn VARCHAR(30),
	title VARCHAR(100), 
	ts TIMESTAMPTZ 
);

SET timezone = 'Asia/Shanghai';

