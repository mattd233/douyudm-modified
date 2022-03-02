DROP TABLE IF EXISTS diange CASCADE;

CREATE TABLE diange(
	id SERIAL PRIMARY KEY,
  nn VARCHAR(30),
	title VARCHAR(100), 
  sang boolean DEFAULT false,
	ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SET timezone = 'Asia/Shanghai';

DROP TABLE IF EXISTS gift CASCADE;

CREATE TABLE gift(
  id SERIAL PRIMARY KEY,
  nn VARCHAR(30),
  gfid INT,
  gfcnt INT,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- test
-- 过期被删除的
INSERT INTO gift(nn, gfid, gfcnt, ts) VALUES('INnoVation保护协会', '20004', '1', '2022-02-26 01:56:54.565941+00');
INSERT INTO gift(nn, gfid, gfcnt, ts) VALUES('INnoVation保护协会', '20003', '2', '2022-02-26 01:56:54.565941+00');
INSERT INTO gift(nn, gfid, gfcnt, ts) VALUES('INnoVation保护协会', '20002', '1', '2022-02-26 01:56:54.565941+00');
INSERT INTO gift(nn, gfid, gfcnt, ts) VALUES('真栗栗的萝卜卜', '21672', '2', '2022-02-26 01:56:54.565941+00');
-- 保留的
INSERT INTO gift(nn, gfid, gfcnt) VALUES('真栗栗的萝卜卜', '21672', '1');
-- 钱不够
INSERT INTO gift(nn, gfid, gfcnt) VALUES('INnoVation保护协会', '20001', '100');
-- 普通sc
-- INSERT INTO gift(nn, gfid, gfcnt) VALUES('INnoVation保护协会', '20002', '5');
-- 高亮sc
INSERT INTO gift(nn, gfid, gfcnt) VALUES('INnoVation保护协会', '20004', '1');

DROP TABLE IF EXISTS sc CASCADE;

CREATE TABLE sc(
  id SERIAL PRIMARY KEY,
  highlight BOOLEAN,
  nn VARCHAR(30),
  avatar VARCHAR(100),
  txt VARCHAR(100),
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
)