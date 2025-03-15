"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { OnboardingFlow } from "@/components/OnboardingFlow"
import { DashboardBackground } from "@/components/DashboardBackground"

export default function OnboardingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token")
    const user = localStorage.getItem("user")

    if (!token || !user) {
      router.push("/login")
      return
    }

    try {
      const parsedUser = JSON.parse(user)
      
      // Check if user has already completed onboarding
      // If they have a mission, values, and at least one project, redirect to dashboard
      if (parsedUser.mission && 
          parsedUser.values?.length > 0) {
        // We'll check for projects separately to avoid blocking the onboarding flow
        // if they have mission and values but no projects yet
        fetch("http://localhost:5000/api/projects", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        .then(res => res.json())
        .then(projects => {
          if (projects.length > 0) {
            router.push("/dashboard")
          } else {
            setIsLoading(false)
            setShowOnboarding(true)
          }
        })
        .catch(err => {
          console.error("Error checking projects:", err)
          setIsLoading(false)
          setShowOnboarding(true)
        })
      } else {
        setIsLoading(false)
        setShowOnboarding(true)
      }
    } catch (error) {
      console.error("Failed to parse user data:", error)
      router.push("/login")
    }
  }, [router])

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="relative">
      {/* Dashboard in Background */}
      <div className="filter blur-sm pointer-events-none">
        <DashboardBackground />
      </div>
      
      {/* Onboarding Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="max-h-[90vh] w-[90vw] max-w-3xl overflow-auto rounded-lg bg-background shadow-lg">
          <OnboardingFlow />
        </div>
      </div>
    </div>
  )
}
