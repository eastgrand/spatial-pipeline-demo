-- Spatial schema. Geometry stored in WGS84 (SRID 4326).
CREATE EXTENSION IF NOT EXISTS postgis;

DROP TABLE IF EXISTS points;
DROP TABLE IF EXISTS regions;

CREATE TABLE regions (
  id    serial PRIMARY KEY,
  name  text NOT NULL,
  geom  geometry(Polygon, 4326) NOT NULL
);

CREATE TABLE points (
  id      serial PRIMARY KEY,
  name    text NOT NULL,
  region  text,                       -- filled by the spatial join
  geom    geometry(Point, 4326) NOT NULL
);

CREATE INDEX regions_geom_gix ON regions USING GIST (geom);
CREATE INDEX points_geom_gix  ON points  USING GIST (geom);
