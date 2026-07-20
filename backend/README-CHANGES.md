# Backend Changes

## 1. Widen `products."productImage"` column

**Problem:** `productImage` was declared as `VARCHAR(255)`, which is too short to
store the image data/URLs being sent from the frontend (Postgres throws
`value too long for type character varying(255)`).

**Fix:** Widen the column to `TEXT` (unlimited length, same storage engine
Postgres uses for `varchar` under the hood — no real downside to switching).

Run this against the database:

```sql
ALTER TABLE products
  ALTER COLUMN "productImage" TYPE TEXT;
```

`schema.sql` has also been updated so any fresh database created from it
already has the wider column — only existing databases need the `ALTER TABLE`
above run manually.
