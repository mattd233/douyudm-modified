DROP TABLE IF EXISTS diange CASCADE;

CREATE TABLE diange(
	id SERIAL PRIMARY KEY,
  nn VARCHAR(30),
	title VARCHAR(100), 
	ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SET timezone = 'Asia/Shanghai';

DROP TABLE IF EXISTS gift CASCADE;

CREATE TABLE gift(
  id SERIAL PRIMARY KEY,
  sn VARCHAR(30),
  gfid INT,
  gc INT,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- test
INSERT INTO gift(sn, gfid, gc) VALUES('INnoVation保护协会', '20004', '1');
INSERT INTO gift(sn, gfid, gc) VALUES('INnoVation保护协会', '20003', '1');
INSERT INTO gift(sn, gfid, gc) VALUES('INnoVation保护协会', '20002', '1');

DROP TABLE IF EXISTS sc CASCADE;

CREATE TABLE sc(
  id SERIAL PRIMARY KEY,
  highlight BOOLEAN,
  nn VARCHAR(30),
  txt VARCHAR(100),
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
)