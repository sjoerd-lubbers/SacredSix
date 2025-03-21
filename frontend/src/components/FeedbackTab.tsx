"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Clock, 
  User, 
  ExternalLink,
  RefreshCw,
  Filter
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { apiEndpoint } from "@/config"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface Feedback {
  _id: string
  userId: {
    _id: string
    name: string
    email: string
  }
  type: "positive" | "negative"
  message: string
  page: string
  timestamp: string
  createdAt: string
}

export function FeedbackTab() {
  const { toast } = useToast()
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredFeedback, setFilteredFeedback] = useState<Feedback[]>([])
  const [typeFilter, setTypeFilter] = useState<"all" | "positive" | "negative">("all")
  const [feedbackStats, setFeedbackStats] = useState({
    total: 0,
    positive: 0,
    negative: 0,
    withComments: 0
  })

  useEffect(() => {
    fetchFeedback()
  }, [])

  const fetchFeedback = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await axios.get(apiEndpoint("feedback"), {
        headers: { Authorization: `Bearer ${token}` }
      })

      setFeedback(response.data)
      setFilteredFeedback(response.data)
      
      // Calculate stats
      const stats = {
        total: response.data.length,
        positive: response.data.filter((item: Feedback) => item.type === "positive").length,
        negative: response.data.filter((item: Feedback) => item.type === "negative").length,
        withComments: response.data.filter((item: Feedback) => item.message && item.message.trim() !== "").length
      }
      setFeedbackStats(stats)
    } catch (error) {
      console.error("Error fetching feedback:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch feedback data. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase()
    setSearchQuery(query)
    applyFilters(query, typeFilter)
  }

  const handleTypeFilterChange = (value: "all" | "positive" | "negative") => {
    setTypeFilter(value)
    applyFilters(searchQuery, value)
  }

  const applyFilters = (query: string, type: "all" | "positive" | "negative") => {
    let filtered = feedback

    // Apply type filter
    if (type !== "all") {
      filtered = filtered.filter(item => item.type === type)
    }

    // Apply search query
    if (query.trim() !== "") {
      filtered = filtered.filter(
        item => 
          (item.userId?.name?.toLowerCase().includes(query) || false) ||
          (item.userId?.email?.toLowerCase().includes(query) || false) ||
          (item.message?.toLowerCase().includes(query) || false) ||
          (item.page?.toLowerCase().includes(query) || false)
      )
    }

    setFilteredFeedback(filtered)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPagePath = (path: string) => {
    // Remove leading slash and replace remaining slashes with " > "
    return path.replace(/^\//, '').replace(/\//g, ' > ').replace(/-/g, ' ')
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbackStats.total}</div>
            <p className="text-xs text-muted-foreground">
              User feedback submissions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive Feedback</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbackStats.positive}</div>
            <p className="text-xs text-muted-foreground">
              {feedbackStats.total > 0 
                ? `${Math.round((feedbackStats.positive / feedbackStats.total) * 100)}% of total feedback`
                : "No feedback yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negative Feedback</CardTitle>
            <ThumbsDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbackStats.negative}</div>
            <p className="text-xs text-muted-foreground">
              {feedbackStats.total > 0 
                ? `${Math.round((feedbackStats.negative / feedbackStats.total) * 100)}% of total feedback`
                : "No feedback yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Detailed Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbackStats.withComments}</div>
            <p className="text-xs text-muted-foreground">
              Feedback with detailed comments
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Input
            placeholder="Search feedback..."
            value={searchQuery}
            onChange={handleSearch}
            className="max-w-sm"
          />
        </div>
        
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <Select 
              value={typeFilter} 
              onValueChange={(value) => handleTypeFilterChange(value as "all" | "positive" | "negative")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Feedback</SelectItem>
                <SelectItem value="positive">Positive Only</SelectItem>
                <SelectItem value="negative">Negative Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchQuery("")
              setTypeFilter("all")
              applyFilters("", "all")
            }}
          >
            <Filter className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
          
          <Button 
            variant="outline" 
            onClick={fetchFeedback}
            disabled={isLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>User Feedback</CardTitle>
          <CardDescription>
            View and analyze feedback submitted by users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">Loading feedback data...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Page</TableHead>
                  <TableHead>Feedback</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeedback.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No feedback found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFeedback.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(item.timestamp || item.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{item.userId?.name || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground">{item.userId?.email || "Unknown"}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.type === "positive" ? "default" : "destructive"}>
                          {item.type === "positive" ? (
                            <div className="flex items-center">
                              <ThumbsUp className="mr-1 h-3 w-3" />
                              <span>Positive</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <ThumbsDown className="mr-1 h-3 w-3" />
                              <span>Negative</span>
                            </div>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <ExternalLink className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{formatPagePath(item.page)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.message ? (
                          <div className="max-w-md">
                            <p className="text-sm">{item.message}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm italic">No detailed feedback provided</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
