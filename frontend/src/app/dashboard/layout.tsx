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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Load sidebar collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed")
    if (savedState !== null) {
      setIsSidebarCollapsed(savedState === "true")
    }
  }, [])

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
            } ${
              isSidebarCollapsed ? "w-16" : "w-64"
            } border-r bg-background md:fixed md:block md:h-screen flex flex-col transition-[width] duration-300 ease-in-out`}
          >
            <div className="flex flex-col h-full">
              <div className="border-b p-4 flex items-center justify-between h-16">
                <div className="flex items-center space-x-2">
                  <Button
                    variant={isSidebarCollapsed ? "outline" : "ghost"}
                    size="icon"
                    className={`hidden md:flex transition-all duration-300 ease-in-out h-9 w-9 ${isSidebarCollapsed ? "bg-primary/5 hover:bg-primary/10" : ""}`}
                    onClick={() => {
                      const newState = !isSidebarCollapsed
                      setIsSidebarCollapsed(newState)
                      localStorage.setItem("sidebarCollapsed", newState.toString())
                    }}
                    title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  >
                    {isSidebarCollapsed ? (
                      <span className="text-sm font-bold flex items-center justify-center w-5 h-5 text-primary animate-pulse">&gt;&gt;</span>
                    ) : (
                      <Menu className="h-5 w-5" />
                    )}
                  </Button>
                  <div className={`overflow-hidden transition-all ${isSidebarCollapsed ? "duration-150 ease-in" : "duration-300 ease-out"} ${isSidebarCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
                    <Link href="/dashboard" className="flex items-center space-x-2">
                      <EnvironmentIndicator variant="app-name" />
                    </Link>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="flex-1 p-4 overflow-y-auto">
                {navSections.map((section, index) => (
                  <div key={index} className={`mb-8 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? "" : "space-y-2"}`}>
                    <h3 className={`text-xs font-semibold text-muted-foreground tracking-wider uppercase px-3 truncate transition-opacity transition-transform ${isSidebarCollapsed ? "opacity-0 translate-y-[-10px] duration-100" : "opacity-100 translate-y-0 duration-200"}`}>
                      {section.title}
                    </h3>
                    <div className={`space-y-1 transition-all duration-300 ease-out ${isSidebarCollapsed ? "" : "mt-1"}`}>
                      {section.items.map((item) => {
                        // Check if this is the active route
                        const isActive = pathname === item.href || 
                          (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center h-9 ${isSidebarCollapsed ? "justify-center" : ""} rounded-md ${isSidebarCollapsed ? "p-[5px]" : "px-3 py-2"} text-sm font-medium
                              ${isActive 
                                ? "bg-primary/10 text-primary font-semibold" 
                                : "hover:bg-accent hover:text-accent-foreground"
                              }`}
                            title={isSidebarCollapsed ? item.label : ""}
                          >
                          <div className="w-6 flex items-center justify-center flex-shrink-0 relative z-10">
                            <item.icon className={`h-6 w-6 ${isActive ? "text-primary" : ""}`} />
                          </div>
                          <span className={`transition-all transition-opacity transition-transform truncate ${isSidebarCollapsed ? "opacity-0 translate-x-[-10px] absolute duration-100" : "opacity-100 translate-x-0 ml-2 duration-200 max-w-[150px]"}`}>{item.label}</span>
                            {isActive && !isSidebarCollapsed && (
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
                <div className={`mb-8 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? "" : "space-y-2"}`}>
                  <h3 className={`text-xs font-semibold text-muted-foreground tracking-wider uppercase px-3 truncate transition-opacity transition-transform ${isSidebarCollapsed ? "opacity-0 translate-y-[-10px] duration-100" : "opacity-100 translate-y-0 duration-200"}`}>
                    {adminSection.title}
                  </h3>
                  <div className={`space-y-1 transition-all duration-300 ease-out ${isSidebarCollapsed ? "" : "mt-1"}`}>
                    {adminSection.items.map((item) => {
                      // Check if this is the active route
                      const isActive = pathname === item.href || 
                        (item.href !== '/dashboard' && pathname.startsWith(item.href));
                      
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center h-9 ${isSidebarCollapsed ? "justify-center" : ""} rounded-md ${isSidebarCollapsed ? "p-[5px]" : "px-3 py-2"} text-sm font-medium
                            ${isActive 
                              ? "bg-primary/10 text-primary font-semibold" 
                              : "hover:bg-accent hover:text-accent-foreground"
                            }`}
                          title={isSidebarCollapsed ? item.label : ""}
                        >
                            <div className="w-6 flex items-center justify-center flex-shrink-0 relative z-10">
                              <item.icon className={`h-6 w-6 ${isActive ? "text-primary" : ""}`} />
                            </div>
                            <span className={`transition-all transition-opacity transition-transform truncate ${isSidebarCollapsed ? "opacity-0 translate-x-[-10px] absolute duration-100" : "opacity-100 translate-x-0 ml-2 duration-200 max-w-[150px]"}`}>{item.label}</span>
                          {isActive && !isSidebarCollapsed && (
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
              <div className={`flex ${isSidebarCollapsed ? "justify-center" : "flex-col space-y-4"}`}>
                {!isSidebarCollapsed ? (
                  <>
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
                  </>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="rounded-full bg-primary/10 hover:bg-primary/20 h-10 w-10"
                      onClick={toggleTheme}
                      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    >
                      {theme === "dark" ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full h-10 w-10"
                      onClick={handleLogout}
                      title="Logout"
                    >
                      <LogOut className="h-6 w-6" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 overflow-x-hidden p-4 md:p-6 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'} transition-[margin] duration-300 ease-in-out`}>{children}</main>
      </div>
      
      {/* Feedback Dialog */}
      <FeedbackDialog />
    </div>
  )
}
