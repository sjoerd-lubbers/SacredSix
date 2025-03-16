import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <header className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-16">
            <div className="flex flex-col justify-center space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Meer Focus Krijgen met Sacred Six
              </h1>
              <p className="text-xl">
                Voel jij je ook overweldigd door eindeloze takenlijsten? Sacred Six is de productiviteitsmethode die je helpt om weer controle te krijgen over je tijd en energie.
              </p>
              <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                <Button asChild size="lg" variant="default">
                  <Link href="/register">Start Nu Gratis</Link>
                </Button>
                <Button asChild size="lg" variant={"secondary"}>
                  <Link href="/login">Inloggen</Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-72 w-72 rounded-lg bg-primary-foreground/10 p-4 shadow-xl">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold">6</div>
                    <div className="mt-2 text-lg">Taken per dag</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Problem-Solution Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-3xl font-bold">Het Probleem van Moderne Productiviteit</h2>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold">Je kent het vast wel...</h3>
              <p className="text-lg text-muted-foreground">
                Je begint je dag vol goede moed, maar raakt al snel overweldigd door eindeloze notificaties, vergaderingen en een groeiende takenlijst. Aan het eind van de dag vraag je je af: "Wat heb ik eigenlijk bereikt?"
              </p>
              <p className="text-lg text-muted-foreground">
                Studies tonen aan dat de gemiddelde professional:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Elke 11 minuten wordt onderbroken</li>
                <li>23% van de tijd besteedt aan het zoeken naar informatie</li>
                <li>Slechts 3 uur per dag echt productief is</li>
              </ul>
              <p className="text-lg font-medium">
                Het resultaat? Stress, burnout en het gevoel dat je altijd achterloopt.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold">De Sacred Six Oplossing</h3>
              <p className="text-lg text-muted-foreground">
                Sacred Six is gebaseerd op een eenvoudig maar krachtig principe: focus op maximaal zes belangrijke taken per dag. Deze timemanagement methode is ontwikkeld na jaren van onderzoek naar hoe topprestateerders hun tijd indelen.
              </p>
              <p className="text-lg text-muted-foreground">
                Door je aandacht te richten op een beperkt aantal taken:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Verminder je cognitieve belasting</li>
                <li>Maak je betere beslissingen over prioriteiten</li>
                <li>Ervaar je meer voldoening door voltooide taken</li>
                <li>Creëer je een duidelijk pad naar je langetermijndoelen</li>
              </ul>
              <p className="text-lg font-medium">
                Sacred Six combineert deze filosofie met AI om je te helpen de juiste zes taken te kiezen voor maximale impact.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Hoe Sacred Six Werkt</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-lg border p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                1
              </div>
              <h3 className="mb-2 text-xl font-semibold">Projecten & Taken Creëren</h3>
              <p className="text-muted-foreground">
                Organiseer je werk in projecten en verdeel ze in behapbare taken. Onze AI helpt je bij het formuleren van effectieve taken voor optimale resultaten.
              </p>
            </div>
            <div className="rounded-lg border p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                2
              </div>
              <h3 className="mb-2 text-xl font-semibold">AI Selecteert Je Dagelijkse Zes</h3>
              <p className="text-muted-foreground">
                Onze intelligente algoritmes analyseren je taken en selecteren de zes meest impactvolle voor vandaag, rekening houdend met deadlines, prioriteiten en je energieniveau.
              </p>
            </div>
            <div className="rounded-lg border p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                3
              </div>
              <h3 className="mb-2 text-xl font-semibold">Reflecteren & Verbeteren</h3>
              <p className="text-muted-foreground">
                Evalueer je voortgang en ontvang AI-gestuurde inzichten om je productiviteit continu te verbeteren. Leer van patronen en ontwikkel een steeds effectievere werkstijl.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-secondary py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Ervaringen van Gebruikers</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="rounded-lg bg-background p-6 shadow-sm">
              <p className="mb-4 italic text-muted-foreground">
                "Voorheen was ik constant afgeleid en had ik het gevoel dat ik nooit genoeg deed. Met Sacred Six heb ik geleerd om me te concentreren op wat echt belangrijk is. Mijn productiviteit is verdubbeld en mijn stressniveau is aanzienlijk gedaald."
              </p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary"></div>
                <div className="ml-4">
                  <div className="font-semibold">Sarah Johnson</div>
                  <div className="text-sm text-muted-foreground">Product Manager</div>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-background p-6 shadow-sm">
              <p className="mb-4 italic text-muted-foreground">
                "Als ondernemer was timemanagement altijd mijn grootste uitdaging. Sacred Six heeft me geholpen om meer focus te krijgen en betere beslissingen te nemen over waar ik mijn tijd aan besteed. De AI-aanbevelingen zijn verrassend accuraat en helpen me om consistent vooruitgang te boeken."
              </p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary"></div>
                <div className="ml-4">
                  <div className="font-semibold">Michael Chen</div>
                  <div className="text-sm text-muted-foreground">Software Ondernemer</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Resultaten die Je Kunt Verwachten</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">42%</div>
              <p className="text-muted-foreground">Toename in voltooide belangrijke taken</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">67%</div>
              <p className="text-muted-foreground">Gebruikers rapporteren minder werkstress</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">89%</div>
              <p className="text-muted-foreground">Meer voldoening aan het eind van de werkdag</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">3.5x</div>
              <p className="text-muted-foreground">Snellere voortgang richting langetermijndoelen</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Klaar om Meer Focus te Krijgen?</h2>
          <p className="mb-8 text-xl max-w-3xl mx-auto">
            Sluit je aan bij duizenden professionals die hun productiviteit hebben getransformeerd met Sacred Six. Begin vandaag nog en ervaar het verschil van een gerichte productiviteitsmethode.
          </p>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link href="/register">Start Gratis Proefperiode</Link>
            </Button>
            <Button asChild size="lg" variant="default">
              <Link href="/about">Ontdek Meer</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-primary-foreground/70">
            Geen creditcard nodig. Gratis proefperiode van 14 dagen.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <div className="text-center md:text-left">
              <div className="text-lg font-semibold">Sacred Six Productiviteitsmethode</div>
              <div className="text-sm text-muted-foreground">© 2025 Alle rechten voorbehouden</div>
            </div>
            <div className="flex space-x-4">
              <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">
                Over Ons
              </Link>
              <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
                Blog
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                Voorwaarden
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
