/*
  Warnings:

  - The primary key for the `Default` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "authcode" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Wordle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "word" TEXT NOT NULL,
    "max_guesses" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creator_id" TEXT NOT NULL,
    CONSTRAINT "Wordle_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Guess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "word" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "wordle_id" TEXT NOT NULL,
    CONSTRAINT "Guess_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Guess_wordle_id_fkey" FOREIGN KEY ("wordle_id") REFERENCES "Wordle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Default" (
    "id" TEXT NOT NULL PRIMARY KEY
);
INSERT INTO "new_Default" ("id") SELECT "id" FROM "Default";
DROP TABLE "Default";
ALTER TABLE "new_Default" RENAME TO "Default";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
