"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreateGameForm } from "@/components/create-game-form"
import { JoinGameForm } from "@/components/join-game-form"

// Game data
const promptCards = [
  "What's that smell?",
  "I drink to forget _____.",
  "_____ is a slippery slope that leads to _____.",
  "What is Batman's guilty pleasure?",
  "What ended my last relationship?",
  "What's the next Happy Meal toy?",
  "What gets better with age?",
  "_____ would be woefully incomplete without _____.",
  "What will always get you laid?",
  "Make a haiku.",
  "What's my secret power?",
  "How am I maintaining my relationship status?",
  "What will I bring back in time to convince people I am a powerful wizard?",
  "In a world ravaged by _____, our only solace is _____.",
  "War! What is it good for?",
]

const responseCards = [
  "A disappointing birthday party",
  "A lifetime of sadness",
  "A moment of silence",
  "A sausage festival",
  "An honest cop with nothing left to lose",
  "Authentic Mexican cuisine",
  "Being on fire",
  "Bingeing and purging",
  "Boogers",
  "Cheating in the Special Olympics",
  "Chunks of dead hitchhiker",
  "Daddy issues",
  "Drinking alone",
  "Eating the last known bison",
  "Edible underpants",
  "Elderly Japanese men",
  "Exactly what you'd expect",
  "Expecting a burp and vomiting on the floor",
  "Famine",
  "Former President George W. Bush",
  "Genital piercings",
  "German dungeon porn",
  "Grandma",
  "Inappropriate yodeling",
  "Lockjaw",
  "My collection of high-tech sex toys",
  "My inner demons",
  "My machete",
  "Not reciprocating oral sex",
  "Poor life choices",
  "Powerful thighs",
  "Prancing",
  "Self-loathing",
  "Sexual tension",
  "Soup that is too hot",
  "The inevitable heat death of the universe",
  "The miracle of childbirth",
  "The primal, ball-slapping sex your parents are having right now",
  "The true meaning of Christmas",
  "The violation of our most basic human rights",
  "The Dance of the Sugar Plum Fairy",
  "The profoundly handicapped",
  "The placenta",
  "The Rev. Dr. Martin Luther King, Jr.",
  "The World of Warcraft",
  "Third base",
  "Waking up half-naked in a Denny's parking lot",
  "Wifely duties",
  "Extremely tight pants",
]

type Player = {
  id: number
  name: string
  hand: string[]
  score: number
  selectedCard: string | null
}

type GameState = {
  round: number
  promptCard: string
  promptCardIndex: number
  cardCzar: number
  players: Player[]
  gamePhase: "selection" | "judging" | "results"
  winner: number | null
}

export default function Home() {
  const [playerNames, setPlayerNames] = useState<string[]>(["Player 1", "Player 2", "Player 3"])
  const [gameStarted, setGameStarted] = useState(false)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [shuffledPrompts, setShuffledPrompts] = useState<string[]>([])
  const [shuffledResponses, setShuffledResponses] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("0")

  // Initialize game
  const startGame = () => {
    // Shuffle cards
    const shuffledPromptCards = [...promptCards].sort(() => Math.random() - 0.5)
    const shuffledResponseCards = [...responseCards].sort(() => Math.random() - 0.5)

    setShuffledPrompts(shuffledPromptCards)
    setShuffledResponses(shuffledResponseCards)

    // Deal cards to players
    const players: Player[] = playerNames.map((name, id) => ({
      id,
      name,
      hand: shuffledResponseCards.slice(id * 7, (id + 1) * 7),
      score: 0,
      selectedCard: null,
    }))

    // Set initial game state
    setGameState({
      round: 1,
      promptCard: shuffledPromptCards[0],
      promptCardIndex: 0,
      cardCzar: 0,
      players,
      gamePhase: "selection",
      winner: null,
    })

    setGameStarted(true)
  }

  // Handle card selection
  const selectCard = (playerId: number, card: string) => {
    if (!gameState || gameState.gamePhase !== "selection" || playerId === gameState.cardCzar) return

    setGameState((prev) => {
      if (!prev) return prev

      const updatedPlayers = [...prev.players]
      updatedPlayers[playerId].selectedCard = card

      // Check if all non-czar players have selected a card
      const allSelected = updatedPlayers
        .filter((_, id) => id !== prev.cardCzar)
        .every((player) => player.selectedCard !== null)

      return {
        ...prev,
        players: updatedPlayers,
        gamePhase: allSelected ? "judging" : "selection",
      }
    })
  }

  // Handle judging
  const judgeCards = (winningPlayerId: number) => {
    if (!gameState || gameState.gamePhase !== "judging") return

    setGameState((prev) => {
      if (!prev) return prev

      const updatedPlayers = [...prev.players]
      updatedPlayers[winningPlayerId].score += 1

      return {
        ...prev,
        players: updatedPlayers,
        gamePhase: "results",
        winner: winningPlayerId,
      }
    })
  }

  // Start next round
  const nextRound = () => {
    if (!gameState) return

    const nextCzar = (gameState.cardCzar + 1) % gameState.players.length
    const nextPromptIndex = gameState.promptCardIndex + 1

    // Deal new cards to replace selected ones
    const updatedPlayers = gameState.players.map((player, id) => {
      if (player.selectedCard === null) return player

      const newHand = [...player.hand]
      const cardIndex = newHand.indexOf(player.selectedCard)
      if (cardIndex !== -1) {
        const nextCardIndex = gameState.players.length * 7 + (gameState.round - 1) * (gameState.players.length - 1) + id
        if (nextCardIndex < shuffledResponses.length) {
          newHand[cardIndex] = shuffledResponses[nextCardIndex]
        } else {
          newHand.splice(cardIndex, 1)
        }
      }

      return {
        ...player,
        hand: newHand,
        selectedCard: null,
      }
    })

    setGameState({
      round: gameState.round + 1,
      promptCard: shuffledPrompts[nextPromptIndex % shuffledPrompts.length],
      promptCardIndex: nextPromptIndex,
      cardCzar: nextCzar,
      players: updatedPlayers,
      gamePhase: "selection",
      winner: null,
    })

    setActiveTab(nextCzar.toString())
  }

  // Update player name
  const updatePlayerName = (index: number, name: string) => {
    const newNames = [...playerNames]
    newNames[index] = name
    setPlayerNames(newNames)
  }

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-zinc-900 text-white">
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold mb-8 text-center">Cards Against Humanity</h1>

          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Play Online</CardTitle>
              <CardDescription className="text-zinc-400">Create a new game or join an existing one</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="create" className="w-full">
                <TabsList className="grid grid-cols-2 bg-zinc-700">
                  <TabsTrigger value="create">Create Game</TabsTrigger>
                  <TabsTrigger value="join">Join Game</TabsTrigger>
                </TabsList>
                <TabsContent value="create" className="mt-4">
                  <CreateGameForm />
                </TabsContent>
                <TabsContent value="join" className="mt-4">
                  <JoinGameForm />
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="text-sm text-zinc-400 flex justify-center">
              <p>Minimum 3 players required to start a game</p>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  if (!gameState) return null

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
              onClick={() => setGameStarted(false)}
              className="text-white border-white hover:bg-zinc-800"
            >
              New Game
            </Button>
          </div>
        </div>

        {/* Prompt Card */}
        <div className="mb-6">
          <Card className="bg-black border-white border-2">
            <CardContent className="p-6">
              <p className="text-xl font-bold text-white">{gameState.promptCard}</p>
              <div className="mt-4 text-sm text-gray-400">Card Czar: {gameState.players[gameState.cardCzar].name}</div>
            </CardContent>
          </Card>
        </div>

        {/* Game Phase Information */}
        <div className="mb-4 p-3 bg-zinc-800 rounded-lg">
          {gameState.gamePhase === "selection" && <p>Everyone except the Card Czar: Select a card to play!</p>}
          {gameState.gamePhase === "judging" && (
            <p>{gameState.players[gameState.cardCzar].name}: Choose the winning card!</p>
          )}
          {gameState.gamePhase === "results" && gameState.winner !== null && (
            <div className="flex flex-col gap-2">
              <p>{gameState.players[gameState.winner].name} wins this round!</p>
              <Button onClick={nextRound} className="bg-white text-black hover:bg-gray-200">
                Next Round
              </Button>
            </div>
          )}
        </div>

        {/* Player Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-zinc-800">
            {gameState.players.map((player, index) => (
              <TabsTrigger
                key={index}
                value={index.toString()}
                className={`flex-1 ${index === gameState.cardCzar ? "bg-black text-white" : ""}`}
              >
                {player.name} ({player.score})
              </TabsTrigger>
            ))}
          </TabsList>

          {gameState.players.map((player, playerIndex) => (
            <TabsContent key={playerIndex} value={playerIndex.toString()} className="mt-4">
              {playerIndex === gameState.cardCzar && gameState.gamePhase === "selection" ? (
                <div className="p-4 bg-zinc-800 rounded-lg text-center">
                  You're the Card Czar this round! Wait for others to select their cards.
                </div>
              ) : playerIndex === gameState.cardCzar && gameState.gamePhase === "judging" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gameState.players
                    .filter((p) => p.id !== gameState.cardCzar && p.selectedCard !== null)
                    .map((p, index) => (
                      <Card
                        key={index}
                        className="bg-white text-black cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => judgeCards(p.id)}
                      >
                        <CardContent className="p-6">
                          <p className="text-lg">{p.selectedCard}</p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {player.hand.map((card, cardIndex) => (
                      <Card
                        key={cardIndex}
                        className={`bg-white text-black cursor-pointer hover:shadow-lg transition-shadow ${
                          player.selectedCard === card ? "ring-2 ring-blue-500" : ""
                        }`}
                        onClick={() => gameState.gamePhase === "selection" && selectCard(playerIndex, card)}
                      >
                        <CardContent className="p-4">
                          <p>{card}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {gameState.gamePhase === "selection" && playerIndex !== gameState.cardCzar && (
                    <div className="text-center">
                      <p>{player.selectedCard ? `You selected: "${player.selectedCard}"` : "Select a card to play"}</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}

