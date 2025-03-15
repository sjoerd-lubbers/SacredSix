"use client"

import ReflectionsTab from "@/components/ReflectionsTab"

export default function SacredSixPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Sacred Six</h1>
        <p className="text-muted-foreground mt-2">
          Beheer je dagelijkse Sacred Six taken
        </p>
      </div>

      <ReflectionsTab />
    </div>
  )
}
