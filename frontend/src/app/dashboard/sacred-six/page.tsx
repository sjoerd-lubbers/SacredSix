"use client"

import { useEffect } from "react"
import { redirect } from "next/navigation"

export default function SacredSixPage() {
  useEffect(() => {
    // Redirect to the Reflections page
    redirect("/dashboard/reflections")
  }, [])

  // This will only be shown briefly before the redirect
  return (
    <div className="flex items-center justify-center h-screen">
      <p>Redirecting to Reflections...</p>
    </div>
  )
}
