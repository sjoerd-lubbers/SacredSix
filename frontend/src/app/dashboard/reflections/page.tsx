"use client"

import ReflectionsTab from "@/components/ReflectionsTab"

export default function ReflectionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reflections</h1>
        <p className="text-muted-foreground mt-2">
          Record and analyze your productivity journey
        </p>
      </div>

      <ReflectionsTab />
    </div>
  )
}
