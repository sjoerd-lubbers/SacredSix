"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { CheckCircle, Calendar, BarChart, Zap, Target, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { apiEndpoint } from "@/config";

interface CompletionStats {
  totalDays: number
  fullyCompletedDays: number
  completionRate: number
  averageTasksCompleted: number
  chartData: {
    date: string
    tasksCompleted: number
    tasksSelected: number
    completionPercentage: number
  }[]
}

export function CompletionRateCard() {
  const { toast } = useToast()
  const [stats, setStats] = useState<CompletionStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return

        const config = {
          headers: { Authorization: `Bearer ${token}` }
        }

        // First, update today's completion record
        await axios.post(apiEndpoint("daily-completion/update"), {}, config)

        // Then fetch the stats
        const response = await axios.get(apiEndpoint("daily-completion/stats"), config)
        setStats(response.data)
      } catch (error) {
        console.error("Error fetching completion stats:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load completion statistics.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [toast])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Completion Rate</CardTitle>
          <CardDescription>Loading statistics...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Completion Rate</CardTitle>
          <CardDescription>No data available yet</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
          Daily Completion Rate
        </CardTitle>
        <CardDescription>
          Percentage of days where all 6 tasks were completed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-4xl font-bold">{stats.completionRate}%</p>
            <p className="text-sm text-muted-foreground">
              {stats.fullyCompletedDays} of {stats.totalDays} days
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold">{stats.averageTasksCompleted}</p>
            <p className="text-sm text-muted-foreground">Avg. tasks completed per day</p>
          </div>
        </div>
        
        {/* Completion Rate Feedback */}
        <div className="rounded-lg border p-4 bg-muted/30">
          {/* Special case for new users with few days of data */}
          {stats.totalDays <= 3 ? (
            <div className="flex items-start space-x-3">
              <Zap className="h-6 w-6 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-blue-700 dark:text-blue-400">Getting started</p>
                <p className="text-sm text-muted-foreground">
                  You're just beginning your productivity journey. Complete your daily tasks to build momentum!
                </p>
              </div>
            </div>
          ) : stats.completionRate >= 80 ? (
            <div className="flex items-start space-x-3">
              <Zap className="h-6 w-6 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">Strong focus rhythm</p>
                <p className="text-sm text-muted-foreground">
                  You're consistently completing your daily tasks. Keep up the great work!
                </p>
              </div>
            </div>
          ) : stats.completionRate >= 50 ? (
            <div className="flex items-start space-x-3">
              <Target className="h-6 w-6 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-700 dark:text-yellow-400">Improvement needed in planning or dedication</p>
                <p className="text-sm text-muted-foreground">
                  You're making progress, but could improve your planning or commitment to daily tasks.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-700 dark:text-red-400">Finding your rhythm</p>
                <p className="text-sm text-muted-foreground">
                  Focus on completing your most important tasks each day to build consistency.
                </p>
              </div>
            </div>
          )}
        </div>

          {stats.chartData.length > 0 && (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar name="Completion %" dataKey="completionPercentage" fill="#22c55e" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
