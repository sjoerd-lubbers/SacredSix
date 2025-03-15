"use client"

import { BookOpen, Lightbulb, Target, Clock, Brain, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function MethodPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">De Sacred Six Methode</h1>
        <p className="text-muted-foreground mt-2">
          Leer over de filosofie en wetenschap achter de Sacred Six productiviteitsmethode.
        </p>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>De Filosofie</CardTitle>
              <CardDescription>De kernprincipes van Sacred Six</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p>
              Sacred Six is gebaseerd op het principe dat kwaliteit belangrijker is dan kwantiteit. 
              Door je dagelijks te concentreren op slechts zes belangrijke taken, verminder je cognitieve belasting 
              en verhoog je de kwaliteit van je werk en beslissingen.
            </p>
            <p className="mt-4">
              Deze methode erkent dat onze mentale energie beperkt is en dat multitasking 
              een illusie is die onze productiviteit vermindert in plaats van verbetert.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Brain className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>De Wetenschap</CardTitle>
              <CardDescription>Onderzoek achter de methode</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p>
              Onderzoek toont aan dat het menselijk brein optimaal functioneert wanneer het zich op één taak tegelijk kan concentreren. 
              Studies van Stanford University en het Microsoft Research Lab bevestigen dat multitasking de productiviteit met wel 40% kan verminderen.
            </p>
            <p className="mt-4">
              De Sacred Six methode is ontwikkeld op basis van cognitieve psychologie, aandachtsonderzoek en productiviteitsstudies.
            </p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mt-8">De Zes Principes</h2>
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Target className="h-6 w-6 text-primary" />
            <CardTitle>Focus</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Concentreer je aandacht op een beperkt aantal taken om diepgaand werk mogelijk te maken en afleiding te minimaliseren.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Lightbulb className="h-6 w-6 text-primary" />
            <CardTitle>Intentie</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Kies bewust taken die bijdragen aan je langetermijndoelen en waarden, in plaats van reactief te werken.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Clock className="h-6 w-6 text-primary" />
            <CardTitle>Ritme</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Werk met je natuurlijke energiecycli en creëer consistente dagelijkse routines voor duurzame productiviteit.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Sparkles className="h-6 w-6 text-primary" />
            <CardTitle>Kwaliteit</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Streef naar uitmuntendheid in minder taken in plaats van middelmatigheid in vele taken.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M7 12a5 5 0 0 1 10 0" />
              <line x1="8" y1="16" x2="8" y2="16.01" />
              <line x1="16" y1="16" x2="16" y2="16.01" />
            </svg>
            <CardTitle>Reflectie</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Evalueer regelmatig je voortgang en pas je aanpak aan op basis van wat werkt en wat niet.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
            <CardTitle>Eliminatie</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Verwijder regelmatig taken, verplichtingen en afleidingen die niet bijdragen aan je belangrijkste doelen.
            </p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mt-8">Dagelijkse Praktijk</h2>
      <Card>
        <CardContent className="pt-6">
          <ol className="list-decimal pl-5 space-y-4">
            <li>
              <strong>Ochtendplanning (5-10 minuten):</strong> Begin elke dag met het selecteren van je Sacred Six taken, 
              gebaseerd op je prioriteiten en energieniveau.
            </li>
            <li>
              <strong>Focussessies (25-90 minuten):</strong> Werk in ononderbroken blokken aan je taken, 
              met korte pauzes tussendoor.
            </li>
            <li>
              <strong>Middag check-in (5 minuten):</strong> Evalueer je voortgang en pas je planning indien nodig aan.
            </li>
            <li>
              <strong>Avondevaluatie (5-10 minuten):</strong> Reflecteer op je dag, vier je successen en 
              noteer lessen voor morgen.
            </li>
            <li>
              <strong>Wekelijkse review (30 minuten):</strong> Evalueer je week, identificeer patronen en 
              plan de komende week.
            </li>
          </ol>
        </CardContent>
      </Card>

      <div className="bg-primary/10 rounded-lg p-6 mt-8">
        <h3 className="text-xl font-bold mb-4">Begin Vandaag</h3>
        <p>
          De Sacred Six methode is eenvoudig te implementeren maar krachtig in resultaten. Begin vandaag nog met het 
          selecteren van je zes belangrijkste taken en ervaar het verschil in focus, productiviteit en voldoening.
        </p>
        <p className="mt-4">
          Gebruik de Sacred Six app om je taken te beheren, je voortgang bij te houden en AI-gestuurde inzichten 
          te ontvangen om je productiviteit te optimaliseren.
        </p>
      </div>
    </div>
  )
}
