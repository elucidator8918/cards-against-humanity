import type { GameState, Player as PlayerType } from "@/types/game"
import { pusherServer } from "./pusher"
import { randomUUID } from "crypto"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Types for database entities
type DbPlayer = {
  id: string;
  name: string;
  hand: string;
  score: number;
  selectedCard: string | null;
  isConnected: boolean;
  isReady: boolean;
}

type DbGame = {
  id: string;
  inviteCode: string;
  round: number;
  promptCard: string;
  promptCardIndex: number;
  cardCzar: string;
  players: DbPlayer[];
  gamePhase: "lobby" | "selection" | "judging" | "results";
  winner: string | null;
  createdAt: Date;
  lastUpdated: Date;
}

type DbResponseCard = {
  text: string;
}

type DbPromptCard = {
  text: string;
}

// Generate a random 6-character invite code
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

// Convert database Player to app Player type
function dbPlayerToAppPlayer(dbPlayer: DbPlayer): PlayerType {
  return {
    id: dbPlayer.id,
    name: dbPlayer.name,
    hand: JSON.parse(dbPlayer.hand),
    score: dbPlayer.score,
    selectedCard: dbPlayer.selectedCard,
    isConnected: dbPlayer.isConnected,
    isReady: dbPlayer.isReady,
  }
}

// Convert database Game to app GameState type
function dbGameToAppGameState(dbGame: DbGame): GameState {
  const players: Record<string, PlayerType> = {}

  for (const dbPlayer of dbGame.players) {
    players[dbPlayer.id] = dbPlayerToAppPlayer(dbPlayer)
  }

  return {
    id: dbGame.id,
    inviteCode: dbGame.inviteCode,
    round: dbGame.round,
    promptCard: dbGame.promptCard,
    promptCardIndex: dbGame.promptCardIndex,
    cardCzar: dbGame.cardCzar,
    players,
    gamePhase: dbGame.gamePhase,
    winner: dbGame.winner,
    createdAt: dbGame.createdAt.getTime(),
    lastUpdated: dbGame.lastUpdated.getTime(),
  }
}

// Create a new game
export async function createGame(hostName: string): Promise<{ gameId: string; inviteCode: string; playerId: string }> {
  const gameId = randomUUID()
  const inviteCode = generateInviteCode()
  const playerId = randomUUID()

  // Get a random prompt card
  const promptCardsCount = await prisma.promptCard.count()
  const randomPromptIndex = Math.floor(Math.random() * promptCardsCount)
  const randomPrompt = await prisma.promptCard.findMany({
    take: 1,
    skip: randomPromptIndex,
  })

  // Create the game and the host player
  const game = await prisma.game.create({
    data: {
      id: gameId,
      inviteCode,
      promptCard: randomPrompt[0].text,
      promptCardIndex: randomPromptIndex,
      cardCzar: playerId,
      players: {
        create: {
          id: playerId,
          name: hostName,
          hand: JSON.stringify([]),
        },
      },
    },
    include: {
      players: true,
    },
  })

  console.log(game)

  return { gameId, inviteCode, playerId }
}

// Get a game by invite code
export async function getGameByInviteCode(inviteCode: string): Promise<GameState | null> {
  const game = await prisma.game.findUnique({
    where: { inviteCode },
    include: { players: true },
  })

  if (!game) {
    return null
  }

  return dbGameToAppGameState(game as DbGame)
}

// Join a game
export async function joinGame(
  inviteCode: string,
  playerName: string,
): Promise<{ gameState: GameState; playerId: string } | null> {
  const game = await prisma.game.findUnique({
    where: { inviteCode },
    include: { players: true },
  })

  if (!game) {
    return null
  }

  // Don't allow joining if the game has already started
  if (game.gamePhase !== "lobby") {
    return null
  }

  const playerId = randomUUID()

  // Add the player to the game
  const updatedGame = await prisma.game.update({
    where: { id: game.id },
    data: {
      players: {
        create: {
          id: playerId,
          name: playerName,
          hand: JSON.stringify([]),
        },
      },
    },
    include: { players: true },
  })

  const gameState = dbGameToAppGameState(updatedGame as DbGame)

  // Notify all clients about the new player
  if (playerId && playerName) {
    pusherServer.trigger(`game-${inviteCode}`, "game-event", { type: "player-joined", playerId, playerName })
  }

  return { gameState, playerId }
}

// Set player ready status
export async function setPlayerReady(
  inviteCode: string,
  playerId: string,
  isReady: boolean,
): Promise<GameState | null> {
  const game = await prisma.game.findUnique({
    where: { inviteCode },
    include: { players: true },
  })

  if (!game) {
    return null
  }

  const player = game.players.find((p: DbPlayer) => p.id === playerId)
  if (!player) {
    return null
  }

  // Update the player's ready status
  await prisma.player.update({
    where: { id: playerId },
    data: { isReady },
  })

  // Notify all clients about the player's ready status
  if (playerId) {
    pusherServer.trigger(`game-${inviteCode}`, "game-event", { type: "player-ready", playerId })
  }

  // Check if all players are ready to start the game
  const allPlayersReady = game.players.every((p: DbPlayer) => (p.id === playerId ? isReady : p.isReady))
  const playerCount = game.players.length

  if (allPlayersReady && playerCount >= 3) {
    return await startGame(inviteCode)
  }

  // Get the updated game
  const updatedGame = await prisma.game.findUnique({
    where: { inviteCode },
    include: { players: true },
  })

  return dbGameToAppGameState(updatedGame as DbGame)
}

// Start the game
export async function startGame(inviteCode: string): Promise<GameState | null> {
  const game = await prisma.game.findUnique({
    where: { inviteCode },
    include: { players: true },
  })

  if (!game) {
    return null
  }

  // Get all response cards
  const responseCards = await prisma.responseCard.findMany()
  const shuffledResponses = shuffleArray(responseCards.map((card: DbResponseCard) => card.text))

  // Deal cards to players
  let cardIndex = 0
  for (const player of game.players) {
    const hand = shuffledResponses.slice(cardIndex, cardIndex + 7)
    cardIndex += 7

    await prisma.player.update({
      where: { id: player.id },
      data: { hand: JSON.stringify(hand) },
    })
  }

  // Update the game state
  const updatedGame = await prisma.game.update({
    where: { id: game.id },
    data: {
      gamePhase: "selection",
      round: 1,
    },
    include: { players: true },
  })

  const gameState = dbGameToAppGameState(updatedGame as DbGame)

  // Notify all clients that the game has started
  pusherServer.trigger(`game-${inviteCode}`, "game-event", { type: "game-started" })

  // Send updated game state to all clients
  if (gameState) {
    pusherServer.trigger(`game-${inviteCode}`, "game-event", { type: "game-state-updated", gameState })
  }

  return gameState
}

// Play a card
export async function playCard(inviteCode: string, playerId: string, card: string): Promise<GameState | null> {
  const game = await prisma.game.findUnique({
    where: { inviteCode },
    include: { players: true },
  })

  if (!game) {
    return null
  }

  const player = game.players.find((p: DbPlayer) => p.id === playerId)
  if (!player) {
    return null
  }

  // Can't play a card if you're the card czar or if it's not the selection phase
  if (playerId === game.cardCzar || game.gamePhase !== "selection") {
    return null
  }

  // Check if the player has the card in their hand
  const hand = JSON.parse(player.hand) as string[]
  if (!hand.includes(card)) {
    return null
  }

  // Update the player's selected card
  await prisma.player.update({
    where: { id: playerId },
    data: { selectedCard: card },
  })

  // Notify all clients about the card selection
  if (playerId) {
    pusherServer.trigger(`game-${inviteCode}`, "game-event", { type: "card-selected", playerId })
  }

  // Get the updated game
  const updatedGame = await prisma.game.findUnique({
    where: { inviteCode },
    include: { players: true },
  })

  // Check if all non-czar players have selected a card
  const allPlayersSelected = updatedGame!.players
    .filter((p: DbPlayer) => p.id !== game.cardCzar)
    .every((p: DbPlayer) => p.selectedCard !== null)

  if (allPlayersSelected) {
    // Update the game phase
    const judgedGame = await prisma.game.update({
      where: { id: game.id },
      data: { gamePhase: "judging" },
      include: { players: true },
    })

    const gameState = dbGameToAppGameState(judgedGame as DbGame)

    // Send updated game state to all clients
    if (gameState) {
      pusherServer.trigger(`game-${inviteCode}`, "game-event", { type: "game-state-updated", gameState })
    }

    return gameState
  }

  return dbGameToAppGameState(updatedGame as DbGame)
}

// Select a winner
export async function selectWinner(inviteCode: string, czarId: string, winnerId: string): Promise<GameState | null> {
  const game = await prisma.game.findUnique({
    where: { inviteCode },
    include: { players: true },
  })

  if (!game) {
    return null
  }

  // Only the card czar can select a winner during the judging phase
  if (czarId !== game.cardCzar || game.gamePhase !== "judging") {
    return null
  }

  // Update the winner's score
  await prisma.player.update({
    where: { id: winnerId },
    data: { score: { increment: 1 } },
  })

  // Update the game state
  const updatedGame = await prisma.game.update({
    where: { id: game.id },
    data: {
      winner: winnerId,
      gamePhase: "results",
    },
    include: { players: true },
  })

  const gameState = dbGameToAppGameState(updatedGame as DbGame)

  // Notify all clients about the winner selection
  if (winnerId) {
    pusherServer.trigger(`game-${inviteCode}`, "game-event", { type: "winner-selected", playerId: winnerId })
  }

  // Send updated game state to all clients
  if (gameState) {
    pusherServer.trigger(`game-${inviteCode}`, "game-event", { type: "game-state-updated", gameState })
  }

  return gameState
}

// Start the next round
export async function nextRound(inviteCode: string): Promise<GameState | null> {
  const game = await prisma.game.findUnique({
    where: { inviteCode },
    include: { players: true },
  })

  if (!game) {
    return null
  }

  // Can only move to the next round from the results phase
  if (game.gamePhase !== "results") {
    return null
  }

  // Get all player IDs
  const playerIds = game.players.map((p: DbPlayer) => p.id)

  // Rotate the card czar
  const currentCzarIndex = playerIds.indexOf(game.cardCzar)
  const nextCzarIndex = (currentCzarIndex + 1) % playerIds.length
  const nextCzarId = playerIds[nextCzarIndex]

  // Get a new prompt card
  const promptCardsCount = await prisma.promptCard.count()
  const nextPromptIndex = (game.promptCardIndex + 1) % promptCardsCount
  const nextPrompt = await prisma.promptCard.findMany({
    take: 1,
    skip: nextPromptIndex,
  })

  // Get all response cards
  const allResponseCards = await prisma.responseCard.findMany()
  const allResponseTexts = allResponseCards.map((card: DbResponseCard) => card.text)

  // Reset selected cards and replace played cards
  for (const player of game.players) {
    if (player.selectedCard) {
      const hand = JSON.parse(player.hand) as string[]
      const cardIndex = hand.indexOf(player.selectedCard)

      if (cardIndex !== -1) {
        // Remove the played card
        hand.splice(cardIndex, 1)

        // Find unused cards
        const usedCards = new Set<string>()
        for (const p of game.players) {
          const playerHand = JSON.parse(p.hand) as string[]
          playerHand.forEach((card) => usedCards.add(card))
          if (p.selectedCard) usedCards.add(p.selectedCard)
        }

        const unusedCards = allResponseTexts.filter((card: string) => !usedCards.has(card))

        // Add a new random card if available
        if (unusedCards.length > 0) {
          const randomCard = unusedCards[Math.floor(Math.random() * unusedCards.length)]
          hand.push(randomCard)
        }
      }

      // Update the player's hand and reset selected card
      await prisma.player.update({
        where: { id: player.id },
        data: {
          hand: JSON.stringify(hand),
          selectedCard: null,
        },
      })
    }
  }

  // Update the game state
  const updatedGame = await prisma.game.update({
    where: { id: game.id },
    data: {
      cardCzar: nextCzarId,
      promptCard: nextPrompt[0].text,
      promptCardIndex: nextPromptIndex,
      winner: null,
      round: { increment: 1 },
      gamePhase: "selection",
    },
    include: { players: true },
  })

  const gameState = dbGameToAppGameState(updatedGame as DbGame)

  // Notify all clients about the new round
  pusherServer.trigger(`game-${inviteCode}`, "game-event", { type: "next-round" })

  // Send updated game state to all clients
  if (gameState) {
    pusherServer.trigger(`game-${inviteCode}`, "game-event", { type: "game-state-updated", gameState })
  }

  return gameState
}

// Leave a game
export async function leaveGame(inviteCode: string, playerId: string): Promise<boolean> {
  const game = await prisma.game.findUnique({
    where: { inviteCode },
    include: { players: true },
  })

  if (!game) {
    return false
  }

  const player = game.players.find((p: DbPlayer) => p.id === playerId)
  if (!player) {
    return false
  }

  // If the game is in the lobby, remove the player completely
  if (game.gamePhase === "lobby") {
    await prisma.player.delete({
      where: { id: playerId },
    })
  } else {
    // Otherwise, mark them as disconnected
    await prisma.player.update({
      where: { id: playerId },
      data: { isConnected: false },
    })
  }

  // Notify all clients about the player leaving
  if (playerId) {
    pusherServer.trigger(`game-${inviteCode}`, "game-event", { type: "player-left", playerId })
  }

  // Get the updated game
  const updatedGame = await prisma.game.findUnique({
    where: { inviteCode },
    include: { players: true },
  })

  // If all players have left, remove the game
  const connectedPlayers = updatedGame!.players.filter((p: DbPlayer) => p.isConnected)
  if (connectedPlayers.length === 0) {
    await prisma.game.delete({
      where: { id: game.id },
    })
    return true
  }

  // If the card czar left, assign a new one
  if (playerId === game.cardCzar) {
    const connectedPlayerIds = connectedPlayers.map((p: DbPlayer) => p.id)
    if (connectedPlayerIds.length > 0) {
      await prisma.game.update({
        where: { id: game.id },
        data: { cardCzar: connectedPlayerIds[0] },
      })
    }
  }

  return true
}

// Clean up old games (call this periodically)
export async function cleanupOldGames(): Promise<void> {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours in milliseconds

  await prisma.game.deleteMany({
    where: {
      lastUpdated: {
        lt: twoHoursAgo,
      },
    },
  })
}