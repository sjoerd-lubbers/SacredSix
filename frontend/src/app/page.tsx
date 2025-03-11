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
                Sacred Six Productivity
              </h1>
              <p className="text-xl">
                Focus on what matters most. Accomplish your goals with AI-powered task prioritization.
              </p>
              <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                <Button asChild size="lg">
                  <Link href="/register">Get Started</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/login">Login</Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-72 w-72 rounded-lg bg-primary-foreground/10 p-4 shadow-xl">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold">6</div>
                    <div className="mt-2 text-lg">Tasks per day</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">How Sacred Six Works</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-lg border p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                1
              </div>
              <h3 className="mb-2 text-xl font-semibold">Create Projects & Tasks</h3>
              <p className="text-muted-foreground">
                Organize your work into projects and break them down into manageable tasks.
              </p>
            </div>
            <div className="rounded-lg border p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                2
              </div>
              <h3 className="mb-2 text-xl font-semibold">AI Selects Your Daily Six</h3>
              <p className="text-muted-foreground">
                Our AI analyzes your tasks and selects the six most important ones for you to focus on today.
              </p>
            </div>
            <div className="rounded-lg border p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                3
              </div>
              <h3 className="mb-2 text-xl font-semibold">Reflect & Improve</h3>
              <p className="text-muted-foreground">
                Reflect on your progress and get AI-powered insights to continuously improve your productivity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-secondary py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">What Our Users Say</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="rounded-lg bg-background p-6 shadow-sm">
              <p className="mb-4 italic text-muted-foreground">
                "Sacred Six has transformed how I work. By focusing on just 6 tasks each day, I've doubled my productivity and reduced my stress."
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
                "The AI recommendations are spot on. It's like having a personal productivity coach that knows exactly what I should be working on."
              </p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary"></div>
                <div className="ml-4">
                  <div className="font-semibold">Michael Chen</div>
                  <div className="text-sm text-muted-foreground">Software Engineer</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Transform Your Productivity?</h2>
          <p className="mb-8 text-xl">
            Join thousands of professionals who have mastered the art of focused productivity.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/register">Get Started for Free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <div className="text-center md:text-left">
              <div className="text-lg font-semibold">Sacred Six Productivity</div>
              <div className="text-sm text-muted-foreground">© 2025 All rights reserved</div>
            </div>
            <div className="flex space-x-4">
              <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">
                About
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
