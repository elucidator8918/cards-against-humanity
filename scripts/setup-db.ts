import { PrismaClient } from "@prisma/client"
import { promptCards, responseCards } from "../data/cards"

const prisma = new PrismaClient()

async function main() {
  try {
    // Create tables
    console.log("Creating database tables...")
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "Game" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "inviteCode" TEXT NOT NULL UNIQUE,
      "round" INTEGER NOT NULL DEFAULT 0,
      "promptCard" TEXT NOT NULL,
      "promptCardIndex" INTEGER NOT NULL,
      "cardCzar" TEXT NOT NULL,
      "gamePhase" TEXT NOT NULL DEFAULT 'lobby',
      "winner" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "lastUpdated" DATETIME NOT NULL
    )`

    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "Player" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "hand" TEXT NOT NULL,
      "score" INTEGER NOT NULL DEFAULT 0,
      "selectedCard" TEXT,
      "isConnected" BOOLEAN NOT NULL DEFAULT true,
      "isReady" BOOLEAN NOT NULL DEFAULT false,
      "gameId" TEXT NOT NULL,
      FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE
    )`

    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "PromptCard" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "text" TEXT NOT NULL
    )`

    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "ResponseCard" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "text" TEXT NOT NULL
    )`

    // Seed cards
    console.log("Seeding cards...")

    // Clear existing cards
    await prisma.promptCard.deleteMany()
    await prisma.responseCard.deleteMany()

    // Seed prompt cards
    for (const text of promptCards) {
      await prisma.promptCard.create({
        data: { text },
      })
    }

    // Seed response cards
    for (const text of responseCards) {
      await prisma.responseCard.create({
        data: { text },
      })
    }

    console.log("Database setup complete!")
  } catch (error) {
    console.error("Error setting up database:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()

