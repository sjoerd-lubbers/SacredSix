"use client"

import { Heart, Target, Compass, Award, Shield, Lightbulb, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function MissionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Onze Missie & Waarden</h1>
        <p className="text-muted-foreground mt-2">
          De drijvende kracht en kernwaarden achter Sacred Six
        </p>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Compass className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Onze Missie</CardTitle>
              <CardDescription>Waar we voor staan</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-7">
              Sacred Six heeft als missie om mensen te helpen hun tijd en energie te richten op wat echt belangrijk is. 
              In een wereld vol afleiding en constante drukte, willen we een tegenwicht bieden door eenvoud, focus en 
              intentionaliteit te bevorderen.
            </p>
            <p className="mt-4 text-lg leading-7">
              We geloven dat iedereen het vermogen heeft om buitengewone resultaten te bereiken door zich te concentreren 
              op een beperkt aantal betekenisvolle taken. Door deze filosofie toegankelijk te maken via intuïtieve tools 
              en AI-ondersteuning, streven we ernaar om mensen te helpen hun potentieel te ontgrendelen en een 
              evenwichtiger, doelgerichter leven te leiden.
            </p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mt-8">Onze Kernwaarden</h2>
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Doelgerichtheid</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              We geloven in het stellen van duidelijke, betekenisvolle doelen en het richten van onze energie op wat echt 
              belangrijk is. Elke functie in onze app is ontworpen om intentioneel handelen te bevorderen.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Eenvoud</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Complexiteit is de vijand van actie. We streven naar eenvoud in alles wat we doen, van onze gebruikersinterface 
              tot onze methodologie. Minder, maar beter, is ons motto.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Balans</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Productiviteit gaat niet alleen om meer doen, maar om het juiste doen. We bevorderen een evenwichtige 
              benadering die ruimte laat voor werk, rust, relaties en persoonlijke groei.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Uitmuntendheid</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              We streven naar uitmuntendheid in alles wat we doen. Dit betekent niet perfectie, maar een toewijding aan 
              voortdurende verbetering en het leveren van de hoogst mogelijke kwaliteit.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Gemeenschap</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              We geloven in de kracht van gemeenschap en gedeelde ervaringen. Door samen te werken en van elkaar te leren, 
              kunnen we allemaal groeien en betere gewoonten ontwikkelen.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Integriteit</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              We handelen met eerlijkheid, transparantie en respect voor de privacy van onze gebruikers. Vertrouwen is de 
              basis van elke relatie, en we werken elke dag om dat vertrouwen te verdienen.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-primary/10 rounded-lg p-6 mt-8">
        <h3 className="text-xl font-bold mb-4">Onze Belofte aan Jou</h3>
        <p className="text-lg">
          Sacred Six belooft je te helpen je tijd en energie te richten op wat echt belangrijk is. We zullen je nooit 
          overladen met onnodige functies of afleidingen. In plaats daarvan bieden we je een eenvoudige, krachtige 
          methodologie en de tools om deze in je dagelijks leven toe te passen.
        </p>
        <p className="mt-4 text-lg">
          We geloven dat door je te concentreren op slechts zes belangrijke taken per dag, je niet alleen productiever 
          zult zijn, maar ook meer voldoening, balans en rust zult ervaren. Dit is geen quick fix of tijdelijke oplossing, 
          maar een duurzame benadering van werk en leven die je op de lange termijn zal ondersteunen.
        </p>
      </div>

      <div className="border-t pt-6 mt-8">
        <blockquote className="italic text-xl text-center">
          "De sleutel tot succes is niet het doen van vele dingen, maar het doen van enkele dingen uitzonderlijk goed."
        </blockquote>
        <p className="text-center mt-2 text-muted-foreground">— Het Sacred Six Team</p>
      </div>
    </div>
  )
}
