"use client"

import { SacredProjectsList } from "@/components/SacredProjectsList"

export default function SacredSixPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sacred Six</h1>
        <p className="text-muted-foreground mt-2">
          Manage your Sacred Six projects
        </p>
      </div>

      <SacredProjectsList />
    </div>
  )
}
