import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { APP_NAME } from '@/config'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <header className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-16">
            <div className="flex flex-col justify-center space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Focus on What Truly Matters with {APP_NAME}
              </h1>
              <p className="text-xl">
                A focused productivity system that ensures you only work on 6 core projects that truly matter, helping you regain control of your time and energy.
              </p>
              <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                <Button asChild size="lg" variant="secondary">
                  <Link href="/register">Get Started</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-white/20 text-white hover:bg-white/30 border-white">
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-72 w-72 rounded-lg bg-primary-foreground/10 p-4 shadow-xl">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold">6</div>
                    <div className="mt-2 text-lg">Projects</div>
                    <div className="mt-1 text-sm">6 Daily Sacred Tasks</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Core Method Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-3xl font-bold">The Core of the {APP_NAME} Method</h2>
          <div className="max-w-3xl mx-auto">
            <div className="mb-8 text-center">
              <p className="text-xl font-medium mb-6">
                <span className="text-primary">✅</span> {APP_NAME} is a focused productivity system that ensures you only work on 6 core projects that truly matter.
              </p>
            </div>
            
            <h3 className="text-2xl font-semibold mb-4 text-center">
              <span className="text-primary">📌</span> How Does It Work?
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-lg border p-6 shadow-sm">
                <h4 className="text-xl font-medium mb-2 flex items-center">
                  <span className="text-primary mr-2">1️⃣</span> Choose Your 6 Sacred Projects
                </h4>
                <p className="text-muted-foreground">
                  These are the key goals in your life or work that deserve your focused attention and energy.
                </p>
              </div>
              
              <div className="rounded-lg border p-6 shadow-sm">
                <h4 className="text-xl font-medium mb-2 flex items-center">
                  <span className="text-primary mr-2">2️⃣</span> Work on 6 Daily Sacred Tasks
                </h4>
                <p className="text-muted-foreground">
                  Every day, complete a maximum of 6 actions that contribute to these projects for maximum impact.
                </p>
              </div>
              
              <div className="rounded-lg border p-6 shadow-sm">
                <h4 className="text-xl font-medium mb-2 flex items-center">
                  <span className="text-primary mr-2">3️⃣</span> Eliminate Distractions
                </h4>
                <p className="text-muted-foreground">
                  Anything that doesn't align with your Sacred Six projects is ignored to maintain your focus.
                </p>
              </div>
              
              <div className="rounded-lg border p-6 shadow-sm">
                <h4 className="text-xl font-medium mb-2 flex items-center">
                  <span className="text-primary mr-2">4️⃣</span> Consistency is Key
                </h4>
                <p className="text-muted-foreground">
                  Small daily steps lead to exponential growth and meaningful progress over time.
                </p>
              </div>
              
              <div className="rounded-lg border p-6 shadow-sm">
                <h4 className="text-xl font-medium mb-2 flex items-center">
                  <span className="text-primary mr-2">5️⃣</span> Reflect & Adjust
                </h4>
                <p className="text-muted-foreground">
                  Regularly evaluate your progress and refine your focus to stay on track with your goals.
                </p>
              </div>
              
              <div className="rounded-lg border p-6 shadow-sm">
                <h4 className="text-xl font-medium mb-2 flex items-center">
                  <span className="text-primary mr-2">6️⃣</span> Stay Mission-Driven
                </h4>
                <p className="text-muted-foreground">
                  {APP_NAME} is more than productivity; it's about living with intention and purpose.
                </p>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-xl font-medium">
                <span className="text-primary">🎯</span> Result: More focus, less chaos, and structured growth in both work and life. <span className="text-primary">🚀</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">How {APP_NAME} Works</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-lg border p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                1
              </div>
              <h3 className="mb-2 text-xl font-semibold">Create Your Sacred Projects</h3>
              <p className="text-muted-foreground">
                Define your 6 most important projects and break them down into manageable tasks. Our AI helps you formulate effective tasks for optimal results.
              </p>
            </div>
            <div className="rounded-lg border p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                2
              </div>
              <h3 className="mb-2 text-xl font-semibold">Focus on Daily Tasks</h3>
              <p className="text-muted-foreground">
                Select 4-6 high-impact tasks each day that align with your sacred projects. Our AI can help prioritize based on deadlines, importance, and your energy levels.
              </p>
            </div>
            <div className="rounded-lg border p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                3
              </div>
              <h3 className="mb-2 text-xl font-semibold">Reflect & Improve</h3>
              <p className="text-muted-foreground">
                Regularly review your progress, celebrate wins, and adjust your approach. Our tools help you track patterns and continuously refine your productivity system.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gradient-to-b from-background to-secondary/10">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Why Choose {APP_NAME}?</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20v-6M6 20V10M18 20V4"/>
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Increased Focus</h3>
              <p className="text-muted-foreground">
                By limiting your attention to just 6 core projects, you eliminate the overwhelm of endless task lists and gain clarity on what truly matters.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Consistent Progress</h3>
              <p className="text-muted-foreground">
                Small daily steps lead to exponential growth. The {APP_NAME} method ensures you make meaningful progress on your most important goals every day.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14Z"/>
                  <path d="M7 22V11"/>
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Reduced Stress</h3>
              <p className="text-muted-foreground">
                Eliminate the anxiety of trying to do everything at once. With a clear system for prioritization, you'll feel more in control and less overwhelmed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Productivity?</h2>
              <p className="text-xl mb-6">
                Start focusing on what truly matters with the {APP_NAME} method. Create your account today and begin your journey to more intentional productivity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" variant="secondary">
                  <Link href="/register">Get Started</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-white/20 text-white hover:bg-white/30 border-white">
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-64 h-64 md:w-80 md:h-80">
                <div className="absolute inset-0 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-7xl font-bold">6</div>
                    <div className="mt-2 text-xl">Projects</div>
                    <div className="mt-1 text-lg">Unlimited Focus</div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-xl font-bold">
                  4-6
                </div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-xl font-bold">
                  Daily
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <div className="text-center md:text-left">
              <div className="text-lg font-semibold">{APP_NAME} Productivity Method</div>
              <div className="text-sm text-muted-foreground">© 2025 All rights reserved</div>
            </div>
            <div className="flex space-x-6">
              <Link href="/login" className="text-sm font-medium text-foreground hover:text-primary">
                Login
              </Link>
              <Link href="/register" className="text-sm font-medium text-foreground hover:text-primary">
                Register
              </Link>
              <Link href="/privacy" className="text-sm font-medium text-foreground hover:text-primary">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
