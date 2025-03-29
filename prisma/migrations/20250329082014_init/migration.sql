-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inviteCode" TEXT NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 0,
    "promptCard" TEXT NOT NULL,
    "promptCardIndex" INTEGER NOT NULL,
    "cardCzar" TEXT NOT NULL,
    "gamePhase" TEXT NOT NULL DEFAULT 'lobby',
    "winner" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "hand" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "selectedCard" TEXT,
    "isConnected" BOOLEAN NOT NULL DEFAULT true,
    "isReady" BOOLEAN NOT NULL DEFAULT false,
    "gameId" TEXT NOT NULL,
    CONSTRAINT "Player_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PromptCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ResponseCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_inviteCode_key" ON "Game"("inviteCode");
