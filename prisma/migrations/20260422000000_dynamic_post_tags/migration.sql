-- Step 1: Drop the enum default so PostgreSQL allows type change
ALTER TABLE "Post" ALTER COLUMN "category" DROP DEFAULT;

-- Step 2: Convert column from PostCategory enum to plain TEXT
ALTER TABLE "Post" ALTER COLUMN "category" TYPE TEXT USING "category"::text;

-- Step 3: Restore a text default
ALTER TABLE "Post" ALTER COLUMN "category" SET DEFAULT 'OTHER';

-- Step 4: Now safe to drop the enum
DROP TYPE IF EXISTS "PostCategory";

-- CreateTable PostTag
CREATE TABLE "PostTag" (
    "id"        TEXT         NOT NULL,
    "name"      TEXT         NOT NULL,
    "slug"      TEXT         NOT NULL,
    "emoji"     TEXT         NOT NULL DEFAULT '',
    "order"     INTEGER      NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostTag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PostTag_slug_key" ON "PostTag"("slug");
CREATE INDEX "PostTag_order_idx"       ON "PostTag"("order");

-- Seed the 5 default categories
INSERT INTO "PostTag" ("id", "name", "slug", "emoji", "order", "createdAt") VALUES
('tag_gossips',     'Shay gossips', 'GOSSIPS',     '☕', 0, NOW()),
('tag_uni',         'Uni stuff',    'UNI',         '📚', 1, NOW()),
('tag_confessions', 'Confessions',  'CONFESSIONS', '🤫', 2, NOW()),
('tag_market',      'Market',       'MARKET',      '🛒', 3, NOW()),
('tag_other',       'Other',        'OTHER',       '💬', 4, NOW());
