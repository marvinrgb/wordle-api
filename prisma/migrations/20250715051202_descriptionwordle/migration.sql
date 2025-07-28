-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Wordle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL DEFAULT 'Today''s REPO password',
    "word" TEXT NOT NULL,
    "max_guesses" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creator_id" TEXT NOT NULL,
    CONSTRAINT "Wordle_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Wordle" ("created_at", "creator_id", "id", "max_guesses", "word") SELECT "created_at", "creator_id", "id", "max_guesses", "word" FROM "Wordle";
DROP TABLE "Wordle";
ALTER TABLE "new_Wordle" RENAME TO "Wordle";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
