"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import * as gameStore from "@/lib/game-store"

// Create a new game
export async function createGame(formData: FormData) {
  const playerName = formData.get("playerName") as string

  if (!playerName || playerName.trim() === "") {
    return { error: "Player name is required" }
  }

  try {
    const { gameId, inviteCode, playerId } = await gameStore.createGame(playerName)
    // Store the player ID in a cookie
    const cookieStore = await cookies()
    cookieStore.set(`player-${inviteCode}`, playerId, {
      maxAge: 60 * 60 * 2, // 2 hours
      path: "/",
    })

    revalidatePath("/")
    return { inviteCode }
  } catch (error) {
    console.error("Error creating game:", error)
    return { error: "Failed to create game" }
  }
}

// Join a game
export async function joinGame(formData: FormData) {
  const inviteCode = (formData.get("inviteCode") as string)?.toUpperCase()
  const playerName = formData.get("playerName") as string

  if (!inviteCode || inviteCode.trim() === "") {
    return { error: "Invite code is required" }
  }

  if (!playerName || playerName.trim() === "") {
    return { error: "Player name is required" }
  }

  try {
    const result = await gameStore.joinGame(inviteCode, playerName)

    if (!result) {
      return { error: "Game not found or already started" }
    }

    // Store the player ID in a cookie
    const cookieStore = await cookies()
    cookieStore.set(`player-${inviteCode}`, result.playerId, {
      maxAge: 60 * 60 * 2, // 2 hours
      path: "/",
    })

    revalidatePath("/")
    return { inviteCode }
  } catch (error) {
    console.error("Error joining game:", error)
    return { error: "Failed to join game" }
  }
}

// Set player ready status
export async function setPlayerReady(inviteCode: string, isReady: boolean) {
  try {
    const cookieStore = await cookies()
    const playerId = cookieStore.get(`player-${inviteCode}`)?.value

    if (!playerId) {
      return { error: "Player not found" }
    }

    const gameState = await gameStore.setPlayerReady(inviteCode, playerId, isReady)

    if (!gameState) {
      return { error: "Game not found" }
    }

    revalidatePath(`/game/${inviteCode}`)
    return { success: true }
  } catch (error) {
    console.error("Error setting player ready:", error)
    return { error: "Failed to set player ready" }
  }
}

// Play a card
export async function playCard(inviteCode: string, card: string) {
  try {
    const cookieStore = await cookies()
    const playerId = cookieStore.get(`player-${inviteCode}`)?.value

    if (!playerId) {
      return { error: "Player not found" }
    }

    const gameState = await gameStore.playCard(inviteCode, playerId, card)

    if (!gameState) {
      return { error: "Failed to play card" }
    }

    revalidatePath(`/game/${inviteCode}`)
    return { success: true }
  } catch (error) {
    console.error("Error playing card:", error)
    return { error: "Failed to play card" }
  }
}

// Select a winner
export async function selectWinner(inviteCode: string, winnerId: string) {
  try {
    const cookieStore = await cookies()
    const playerId = cookieStore.get(`player-${inviteCode}`)?.value

    if (!playerId) {
      return { error: "Player not found" }
    }

    const gameState = await gameStore.selectWinner(inviteCode, playerId, winnerId)

    if (!gameState) {
      return { error: "Failed to select winner" }
    }

    revalidatePath(`/game/${inviteCode}`)
    return { success: true }
  } catch (error) {
    console.error("Error selecting winner:", error)
    return { error: "Failed to select winner" }
  }
}

// Start next round
export async function nextRound(inviteCode: string) {
  try {
    const gameState = await gameStore.nextRound(inviteCode)

    if (!gameState) {
      return { error: "Failed to start next round" }
    }

    revalidatePath(`/game/${inviteCode}`)
    return { success: true }
  } catch (error) {
    console.error("Error starting next round:", error)
    return { error: "Failed to start next round" }
  }
}

// Leave game
export async function leaveGame(inviteCode: string) {
  try {
    const cookieStore = await cookies()
    const playerId = cookieStore.get(`player-${inviteCode}`)?.value

    if (!playerId) {
      return { error: "Player not found" }
    }

    const success = await gameStore.leaveGame(inviteCode, playerId)

    if (!success) {
      return { error: "Failed to leave game" }
    }

    // Remove the player ID cookie
    cookieStore.delete(`player-${inviteCode}`)

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error leaving game:", error)
    return { error: "Failed to leave game" }
  }
}

// Get current player ID
export async function getCurrentPlayerId(inviteCode: string): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(`player-${inviteCode}`)?.value || null
}

// Get game state
export async function getGameState(inviteCode: string) {
  return gameStore.getGameByInviteCode(inviteCode)
}

