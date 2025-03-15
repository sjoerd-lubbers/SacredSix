"use client"

import ElementsTab from "@/components/ElementsTab"

export default function PersonalMissionPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Persoonlijke Missie & Waarden</h1>
        <p className="text-muted-foreground mt-2">
          Definieer je persoonlijke missie en kernwaarden om je Sacred Six ervaring te personaliseren
        </p>
      </div>

      <ElementsTab />
    </div>
  )
}
