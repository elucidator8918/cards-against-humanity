import { PrismaClient } from "@prisma/client"
import { promptCards, responseCards } from "../data/cards"

const prisma = new PrismaClient()

async function main() {
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

  console.log("Database seeded!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

