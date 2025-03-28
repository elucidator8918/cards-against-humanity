"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { GameState } from "@/types/game"
import { useGameEvents } from "@/hooks/use-game-events"
import { playCard, selectWinner, nextRound, leaveGame } from "@/app/actions"
import { LogOut } from "lucide-react"

interface GameBoardProps {
  inviteCode: string
  gameState: GameState
  playerId: string
}

export function GameBoard({ inviteCode, gameState: initialGameState, playerId }: GameBoardProps) {
  const router = useRouter()
  const [gameState, setGameState] = useState(initialGameState)

  // Subscribe to game events
  useGameEvents(inviteCode, (event) => {
    if (event.type === "game-state-updated") {
      setGameState(event.gameState)
    } else {
      router.refresh()
    }
  })

  // Handle card selection
  const handleSelectCard = async (card: string) => {
    if (gameState.gamePhase !== "selection" || playerId === gameState.cardCzar) return
    if (gameState.players[playerId].selectedCard === card) return

    await playCard(inviteCode, card)
  }

  // Handle winner selection
  const handleSelectWinner = async (winnerId: string) => {
    if (gameState.gamePhase !== "judging" || playerId !== gameState.cardCzar) return

    await selectWinner(inviteCode, winnerId)
  }

  // Handle next round
  const handleNextRound = async () => {
    if (gameState.gamePhase !== "results") return

    await nextRound(inviteCode)
  }

  // Handle leave game
  const handleLeaveGame = async () => {
    await leaveGame(inviteCode)
    router.push("/")
  }

  // Get current player
  const currentPlayer = gameState.players[playerId]

  // Check if all non-czar players have selected a card
  const allPlayersSelected = Object.values(gameState.players)
    .filter((player) => player.id !== gameState.cardCzar && player.isConnected)
    .every((player) => player.selectedCard !== null)

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Cards Against Humanity</h1>
          <div className="flex items-center gap-2">
            <span>Round: {gameState.round}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLeaveGame}
              className="text-white border-white hover:bg-zinc-800"
            >
              <LogOut className="h-4 w-4 mr-2" /> Leave
            </Button>
          </div>
        </div>

        {/* Prompt Card */}
        <div className="mb-6">
          <Card className="bg-black border-white border-2">
            <CardContent className="p-6">
              <p className="text-xl font-bold text-white">{gameState.promptCard}</p>
              <div className="mt-4 text-sm text-gray-400">
                Card Czar: {gameState.players[gameState.cardCzar].name}
                {gameState.cardCzar === playerId && " (You)"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Game Phase Information */}
        <div className="mb-4 p-3 bg-zinc-800 rounded-lg">
          {gameState.gamePhase === "selection" && (
            <p>
              {gameState.cardCzar === playerId
                ? "You're the Card Czar! Wait for others to select their cards."
                : "Select a card from your hand to play!"}
            </p>
          )}
          {gameState.gamePhase === "judging" && (
            <p>
              {gameState.cardCzar === playerId
                ? "You're the Card Czar! Choose the winning card!"
                : "The Card Czar is choosing the winning card..."}
            </p>
          )}
          {gameState.gamePhase === "results" && gameState.winner !== null && (
            <div className="flex flex-col gap-2">
              <p>
                {gameState.players[gameState.winner].name}
                {gameState.winner === playerId ? " (You)" : ""}
                wins this round with "{gameState.players[gameState.winner].selectedCard}"!
              </p>
              <Button onClick={handleNextRound} className="bg-white text-black hover:bg-gray-200">
                Next Round
              </Button>
            </div>
          )}
        </div>

        {/* Player Scores */}
        <div className="mb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {Object.values(gameState.players).map((player) => (
            <div
              key={player.id}
              className={`p-2 rounded-md ${
                player.id === gameState.cardCzar ? "bg-black text-white" : "bg-zinc-800"
              } ${!player.isConnected ? "opacity-50" : ""}`}
            >
              <div className="flex justify-between items-center">
                <span className="truncate">
                  {player.name}
                  {player.id === playerId ? " (You)" : ""}
                </span>
                <span className="font-bold">{player.score}</span>
              </div>
              {!player.isConnected && <span className="text-xs text-red-500">Disconnected</span>}
            </div>
          ))}
        </div>

        {/* Game Content Based on Phase and Role */}
        <div className="mt-6">
          {/* Card Czar waiting during selection */}
          {gameState.gamePhase === "selection" && gameState.cardCzar === playerId && (
            <div className="p-4 bg-zinc-800 rounded-lg text-center">
              <p className="mb-2">Waiting for players to select their cards:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {Object.values(gameState.players)
                  .filter((player) => player.id !== gameState.cardCzar && player.isConnected)
                  .map((player) => (
                    <div
                      key={player.id}
                      className={`px-3 py-1 rounded-full ${player.selectedCard ? "bg-green-500" : "bg-zinc-700"}`}
                    >
                      {player.name}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Player selecting a card */}
          {gameState.gamePhase === "selection" && gameState.cardCzar !== playerId && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {currentPlayer.hand.map((card, cardIndex) => (
                  <Card
                    key={cardIndex}
                    className={`bg-white text-black cursor-pointer hover:shadow-lg transition-shadow ${
                      currentPlayer.selectedCard === card ? "ring-2 ring-blue-500" : ""
                    }`}
                    onClick={() => handleSelectCard(card)}
                  >
                    <CardContent className="p-4">
                      <p>{card}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center">
                <p>
                  {currentPlayer.selectedCard
                    ? `You selected: "${currentPlayer.selectedCard}"`
                    : "Select a card to play"}
                </p>
              </div>
            </div>
          )}

          {/* Card Czar judging */}
          {gameState.gamePhase === "judging" && gameState.cardCzar === playerId && (
            <div className="space-y-4">
              <p className="text-center mb-2">Choose the winning card:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.values(gameState.players)
                  .filter((player) => player.id !== gameState.cardCzar && player.selectedCard !== null)
                  .map((player) => (
                    <Card
                      key={player.id}
                      className="bg-white text-black cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => handleSelectWinner(player.id)}
                    >
                      <CardContent className="p-6">
                        <p className="text-lg">{player.selectedCard}</p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* Players waiting for judgment */}
          {gameState.gamePhase === "judging" && gameState.cardCzar !== playerId && (
            <div className="space-y-4">
              <p className="text-center mb-2">The Card Czar is choosing the winner...</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.values(gameState.players)
                  .filter((player) => player.id !== gameState.cardCzar && player.selectedCard !== null)
                  .map((player) => (
                    <Card
                      key={player.id}
                      className={`bg-white text-black ${player.id === playerId ? "ring-2 ring-blue-500" : ""}`}
                    >
                      <CardContent className="p-6">
                        <p className="text-lg">{player.selectedCard}</p>
                        {player.id === playerId && <p className="text-sm text-gray-500 mt-2">Your card</p>}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* Results phase */}
          {gameState.gamePhase === "results" && gameState.winner !== null && (
            <div className="space-y-4">
              <div className="bg-zinc-800 p-4 rounded-lg">
                <p className="text-xl text-center mb-2">Winning Card:</p>
                <Card className="bg-white text-black border-green-500 border-2">
                  <CardContent className="p-6">
                    <p className="text-lg">{gameState.players[gameState.winner].selectedCard}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Played by: {gameState.players[gameState.winner].name}
                      {gameState.winner === playerId ? " (You)" : ""}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

