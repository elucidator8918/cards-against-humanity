export type Player = {
  id: string
  name: string
  hand: string[]
  score: number
  selectedCard: string | null
  isConnected: boolean
  isReady: boolean
}

export type GameState = {
  id: string
  inviteCode: string
  round: number
  promptCard: string
  promptCardIndex: number
  cardCzar: string
  players: Record<string, Player>
  gamePhase: "lobby" | "selection" | "judging" | "results"
  winner: string | null
  createdAt: number
  lastUpdated: number
}

export type GameEvent =
  | { type: "player-joined"; playerId: string; playerName: string }
  | { type: "player-left"; playerId: string }
  | { type: "player-ready"; playerId: string }
  | { type: "game-started" }
  | { type: "card-selected"; playerId: string; card: string }
  | { type: "winner-selected"; playerId: string }
  | { type: "next-round" }
  | { type: "game-state-updated"; gameState: GameState }

