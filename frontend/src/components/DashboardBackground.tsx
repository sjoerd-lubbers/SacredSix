"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
  ShieldCheck
} from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Avatar } from "@/components/ui/avatar"
import DashboardPage from "@/app/dashboard/page"

export function DashboardBackground() {
  const router = useRouter()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")
    const token = localStorage.getItem("token")

    if (!storedUser || !token) {
      return
    }

    try {
      setUser(JSON.parse(storedUser))
    } catch (error) {
      console.error("Failed to parse user data:", error)
    }
  }, [])

  if (!user) {
    return null
  }

  // Define navigation items
  let navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/today", label: "Today", icon: CheckSquare },
    { href: "/dashboard/projects", label: "Projects", icon: Calendar },
    { href: "/dashboard/shared-projects", label: "Shared Projects", icon: Users },
    { href: "/dashboard/sacred-six", label: "Sacred Six", icon: Sparkles },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ]
  
  // Add admin link for admin users
  if (user.role === "admin") {
    navItems.push({ href: "/dashboard/admin", label: "Admin", icon: ShieldCheck })
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-10 border-b bg-background py-4 md:hidden">
        <div className="container flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold">Sacred Six</span>
          </div>
          <div className="flex items-center space-x-2">
            <Avatar name={user.name} size="sm" />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-background hidden md:block md:fixed md:h-screen flex flex-col">
          <div className="flex flex-col h-full">
            <div className="border-b p-4">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold">Sacred Six</span>
              </div>
            </div>
            <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
              {navItems.map((item) => (
                <div
                  key={item.href}
                  className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </div>
              ))}
            </nav>
            <div className="border-t p-4 bg-background">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 max-w-[75%]">
                    <Avatar name={user.name} size="sm" />
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-full bg-primary/10 hover:bg-primary/20 flex-shrink-0"
                  >
                    {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden p-4 md:p-6 md:ml-64">
          <DashboardPage />
        </main>
      </div>
    </div>
  )
}
