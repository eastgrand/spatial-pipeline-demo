# Spatial Pipeline Demo

A small, end-to-end geospatial pipeline: **ingest GeoJSON into PostGIS, run real spatial joins in the database, and serve the result on an interactive map.**

It uses a neutral sample dataset — 15 US cities (points) and three regional bands West / Central / East (polygons) — and answers three questions every spatial project asks:

1. **Which region is each point in?** (point-in-polygon, `ST_Contains`)
2. **What are the nearest points to a location?** (KNN, `<->`)
3. **Which points fall within N km of a location?** (distance buffer, `ST_DWithin` on geography)

The spatial work is done **in the database**, not in application code, so it stays correct and fast as the data grows from 15 rows to millions.

## Stack

PostGIS · TypeScript (Node, `tsx`) · `pg` · Hono (read API) · MapLibre GL (map). No API keys — the basemap is OpenStreetMap raster tiles.

## Run it

```bash
cp .env.example .env
npm install
npm run db:up        # Postgres + PostGIS via Docker
npm run pipeline     # ingest sample data, then run the spatial joins (prints results)
npm run serve        # map + API at http://localhost:3000
```

`npm run pipeline` prints the region counts, the five nearest cities to the reference point, and the cities within 1,200 km. `npm run serve` renders the points colored by their joined region; click a point for its details.

## Layout

```
data/      sample-points.geojson, sample-regions.geojson   (swap for real data)
src/
  schema.sql   PostGIS tables + GiST indexes
  ingest.ts    apply schema, load GeoJSON (ST_GeomFromGeoJSON)
  join.ts      the three spatial operations
  api.ts       GeoJSON read API + static host (ST_AsGeoJSON)
  db.ts        pg pool
web/         MapLibre map (index.html, app.js)
```

## Using real data

The sample files are the only thing specific to this demo. Point `ingest.ts` at any GeoJSON — US Census cartographic boundary files, Natural Earth, a county parcel export (geometry + a price field, no owners), GTFS stops, EPA facility locations — and the schema, joins, API, and map are unchanged. The regional bands are deliberately simple rectangles; replace them with real administrative boundaries and the `ST_Contains` join still just works.

## License

MIT. See `LICENSE`.
