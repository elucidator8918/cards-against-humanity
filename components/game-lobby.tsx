"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { GameState } from "@/types/game"
import { useGameEvents } from "@/hooks/use-game-events"
import { setPlayerReady, leaveGame } from "@/app/actions"
import { Check, Copy, LogOut } from "lucide-react"

interface GameLobbyProps {
  inviteCode: string
  gameState: GameState
  playerId: string
}

export function GameLobby({ inviteCode, gameState: initialGameState, playerId }: GameLobbyProps) {
  const router = useRouter()
  const [gameState, setGameState] = useState(initialGameState)
  const [copied, setCopied] = useState(false)
  const [isReady, setIsReady] = useState(false)

  // Subscribe to game events
  useGameEvents(inviteCode, (event) => {
    if (event.type === "player-joined" || event.type === "player-left" || event.type === "player-ready") {
      router.refresh()
    } else if (event.type === "game-started" || event.type === "game-state-updated") {
      if (event.type === "game-state-updated") {
        setGameState(event.gameState)
      }
      router.refresh()
    }
  })

  // Update local ready state when the server state changes
  useEffect(() => {
    if (gameState.players[playerId]) {
      setIsReady(gameState.players[playerId].isReady)
    }
  }, [gameState, playerId])

  // Copy invite code to clipboard
  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Toggle ready status
  const toggleReady = async () => {
    const newReadyState = !isReady
    setIsReady(newReadyState)
    await setPlayerReady(inviteCode, newReadyState)
  }

  // Leave the game
  const handleLeaveGame = async () => {
    await leaveGame(inviteCode)
    router.push("/")
  }

  // Count ready players
  const readyPlayerCount = Object.values(gameState.players).filter((player) => player.isReady).length
  const totalPlayerCount = Object.values(gameState.players).length
  const canStart = readyPlayerCount >= 3 && readyPlayerCount === totalPlayerCount

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-zinc-900 text-white">
      <Card className="w-full max-w-md bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">Game Lobby</CardTitle>
          <CardDescription className="text-zinc-400">Waiting for players to join and get ready</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-zinc-700 p-3 rounded-md flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Invite Code</p>
              <p className="text-xl font-mono">{inviteCode}</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={copyInviteCode}
              className="text-white border-zinc-600 hover:bg-zinc-600"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Players ({totalPlayerCount}/10)</h3>
            <div className="space-y-2">
              {Object.values(gameState.players).map((player) => (
                <div key={player.id} className="flex items-center justify-between bg-zinc-700 p-2 rounded-md">
                  <span>
                    {player.name} {player.id === playerId && " (You)"}
                  </span>
                  {player.isReady ? (
                    <span className="text-green-500 flex items-center">
                      <Check className="h-4 w-4 mr-1" /> Ready
                    </span>
                  ) : (
                    <span className="text-zinc-400">Not Ready</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-700 p-3 rounded-md">
            <p className="text-center">
              {canStart
                ? "All players are ready! The game will start automatically."
                : `Waiting for players to get ready (${readyPlayerCount}/${totalPlayerCount})`}
            </p>
            <p className="text-center text-zinc-400 text-sm mt-1">Minimum 3 players required to start</p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleLeaveGame} className="text-white border-zinc-600 hover:bg-zinc-600">
            <LogOut className="h-4 w-4 mr-2" /> Leave
          </Button>

          <Button
            onClick={toggleReady}
            className={isReady ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}
          >
            {isReady ? "Not Ready" : "Ready"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

