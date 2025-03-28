import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { promptCards, responseCards } from "@/data/cards"

const prisma = new PrismaClient()

export async function GET() {
  try {
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

    return NextResponse.json({ success: true, message: "Database seeded successfully" })
  } catch (error) {
    console.error("Error seeding database:", error)
    return NextResponse.json({ success: false, error: "Failed to seed database" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

