"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Moon,
  Sun,
  BookOpen,
  Users,
  Sparkles,
  ShieldCheck,
  Heart,
  Target
} from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Avatar } from "@/components/ui/avatar"
import { EnvironmentIndicator } from "@/components/EnvironmentIndicator"
import { FeedbackDialog } from "@/components/FeedbackDialog"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")
    const token = localStorage.getItem("token")

    if (!storedUser || !token) {
      router.push("/login")
      return
    }

    try {
      setUser(JSON.parse(storedUser))
    } catch (error) {
      console.error("Failed to parse user data:", error)
      localStorage.removeItem("user")
      localStorage.removeItem("token")
      router.push("/login")
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    })
    
    router.push("/login")
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  if (!user) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  // Define navigation sections
  const navSections = [
    {
      title: "Main",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/dashboard/today", label: "Daily Sacred 6", icon: CheckSquare },
        { href: "/dashboard/projects", label: "My Projects", icon: Calendar },
        { href: "/dashboard/shared-projects", label: "Shared Projects", icon: Users },
      ]
    },
    {
      title: "Sacred System",
      items: [
        { href: "/dashboard/personal-mission", label: "My Mission & Values", icon: Target },
        { href: "/dashboard/reflections", label: "My Reflections", icon: BookOpen },
      ]
    },
    {
      title: "Settings",
      items: [
        { href: "/dashboard/settings", label: "Preferences", icon: Settings },
      ]
    }
  ]
  
  // Add admin section for admin users
  const adminSection = user.role === "admin" ? {
    title: "Admin",
    items: [
      { href: "/dashboard/admin", label: "System Admin", icon: ShieldCheck }
    ]
  } : null

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* No environment ribbon - using app-name indicator only */}
      
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 border-b bg-background py-4 md:hidden">
        <div className="container flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <EnvironmentIndicator variant="app-name" />
          </Link>
          <div className="flex items-center space-x-2">
            <Avatar name={user.name} size="sm" />
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
          <aside
            className={`${
              isMobileMenuOpen ? "fixed inset-y-0 left-0 z-50" : "hidden"
            } w-64 border-r bg-background md:fixed md:block md:h-screen flex flex-col`}
          >
            <div className="flex flex-col h-full">
              <div className="border-b p-4 flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center space-x-2">
                  <EnvironmentIndicator variant="app-name" />
                </Link>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="flex-1 space-y-6 p-4 overflow-y-auto">
                {navSections.map((section, index) => (
                  <div key={index} className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase px-3">
                      {section.title}
                    </h3>
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        // Check if this is the active route
                        const isActive = pathname === item.href || 
                          (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors
                              ${isActive 
                                ? "bg-primary/10 text-primary font-semibold" 
                                : "hover:bg-accent hover:text-accent-foreground"
                              }`}
                          >
                            <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                            <span>{item.label}</span>
                            {isActive && (
                              <div className="ml-auto w-1.5 h-5 bg-primary rounded-full"></div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              
              {/* Admin Section (only for admin users) */}
              {adminSection && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase px-3">
                    {adminSection.title}
                  </h3>
                  <div className="space-y-1">
                    {adminSection.items.map((item) => {
                      // Check if this is the active route
                      const isActive = pathname === item.href || 
                        (item.href !== '/dashboard' && pathname.startsWith(item.href));
                      
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors
                            ${isActive 
                              ? "bg-primary/10 text-primary font-semibold" 
                              : "hover:bg-accent hover:text-accent-foreground"
                            }`}
                        >
                          <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                          <span>{item.label}</span>
                          {isActive && (
                            <div className="ml-auto w-1.5 h-5 bg-primary rounded-full"></div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </nav>
            <div className="border-t p-4 bg-background">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-primary/5">
                  <Avatar name={user.name} size="md" className="border-2 border-primary/20" />
                  <div className="overflow-hidden flex-1">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 justify-start"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="ml-2 rounded-full bg-primary/10 hover:bg-primary/20 flex-shrink-0 h-9 w-9"
                    onClick={toggleTheme}
                    title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                  >
                    {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden p-4 md:p-6 md:ml-64">{children}</main>
      </div>
      
      {/* Feedback Dialog */}
      <FeedbackDialog />
    </div>
  )
}
