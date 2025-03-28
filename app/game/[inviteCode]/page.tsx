import { redirect } from "next/navigation";
import { getCurrentPlayerId, getGameState } from "@/app/actions";
import { GameLobby } from "@/components/game-lobby";
import { GameBoard } from "@/components/game-board";

export default async function GamePage({ params }: { params: { inviteCode: string } }) {
  const { inviteCode } = await params; // No need to await here, but it's now inside an async function.
  
  const playerId = await getCurrentPlayerId(inviteCode); // Await here
  const gameState = await getGameState(inviteCode); // Await here

  // If the game doesn't exist, redirect to home
  if (!gameState) {
    redirect("/");
  }

  // If the player is not in the game, redirect to home
  if (!playerId || !gameState.players[playerId]) {
    redirect("/");
  }

  // Render the appropriate component based on game phase
  if (gameState.gamePhase === "lobby") {
    return <GameLobby inviteCode={inviteCode} gameState={gameState} playerId={playerId} />;
  }

  return <GameBoard inviteCode={inviteCode} gameState={gameState} playerId={playerId} />;
}

