"use client"

import { useEffect } from "react"
import { pusherClient } from "@/lib/pusher"
import type { GameEvent } from "@/types/game"

export function useGameEvents(inviteCode: string, onGameEvent: (event: GameEvent) => void) {
  useEffect(() => {
    const channel = pusherClient.subscribe(`game-${inviteCode}`)

    channel.bind("game-event", (event: GameEvent) => {
      onGameEvent(event)
    })

    return () => {
      pusherClient.unsubscribe(`game-${inviteCode}`)
    }
  }, [inviteCode, onGameEvent])
}

