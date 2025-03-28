"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createGame } from "@/app/actions"

export function CreateGameForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    try {
      const result = await createGame(formData)

      if (result.error) {
        setError(result.error)
      } else {
        router.push(`/game/${result.inviteCode}`)
      }
    } catch (err) {
      setError("Failed to create game. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="create-name">Your Name</Label>
        <Input
          id="create-name"
          name="playerName"
          placeholder="Enter your name"
          required
          className="bg-zinc-700 border-zinc-600 text-white"
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Game"}
      </Button>
    </form>
  )
}

