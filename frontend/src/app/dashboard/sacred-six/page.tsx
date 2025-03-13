"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ReflectionsTab from "@/components/ReflectionsTab"
import ElementsTab from "@/components/ElementsTab"

export default function SacredSixPage() {
  const [activeTab, setActiveTab] = useState("reflections")

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Sacred Six</h1>
        <p className="text-muted-foreground mt-2">
          Manage your mission, values, and reflections
        </p>
      </div>

      <Tabs defaultValue="reflections" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="reflections">Reflections</TabsTrigger>
          <TabsTrigger value="elements">Mission and Values</TabsTrigger>
        </TabsList>
        
        <TabsContent value="reflections" className="space-y-4">
          <ReflectionsTab />
        </TabsContent>
        
        <TabsContent value="elements" className="space-y-4">
          <ElementsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
