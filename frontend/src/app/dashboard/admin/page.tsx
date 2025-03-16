"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  ShieldOff,
  Search,
  Calendar,
  BarChart,
  CheckSquare,
  Folder,
  BookOpen,
  Activity,
  Clock
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export default function AdminPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    newUsers: 0,
    adminUsers: 0
  })
  const [systemStats, setSystemStats] = useState({
    projects: { total: 0, new: 0 },
    tasks: { 
      total: 0, 
      completed: 0, 
      new: 0, 
      newCompleted: 0, 
      completionRate: 0 
    },
    reflections: { total: 0, new: 0 },
    performance: { avgDailyCompletionRate: 0 }
  })
  const [activities, setActivities] = useState<any[]>([])
  const [isStatsLoading, setIsStatsLoading] = useState(true)
  const [isActivityLoading, setIsActivityLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in and is admin
    const token = localStorage.getItem("token")
    const user = localStorage.getItem("user")

    if (!token || !user) {
      router.push("/login")
      return
    }

    try {
      const parsedUser = JSON.parse(user)
      if (parsedUser.role !== "admin") {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have permission to access this page.",
        })
        router.push("/dashboard")
        return
      }

      // Fetch data
      fetchUsers()
      fetchUserStats()
      fetchSystemStats()
      fetchActivity()
    } catch (error) {
      console.error("Failed to parse user data:", error)
      router.push("/dashboard")
    }
  }, [router])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(apiEndpoint("admin/users"), {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsers(response.data)
      setFilteredUsers(response.data)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch users. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(apiEndpoint("admin/users/count"), {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUserStats(response.data)
    } catch (error) {
      console.error("Error fetching user stats:", error)
    }
  }
  
  const fetchSystemStats = async () => {
    setIsStatsLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(apiEndpoint("admin/stats"), {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSystemStats(response.data)
    } catch (error) {
      console.error("Error fetching system stats:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch system statistics. Please try again.",
      })
    } finally {
      setIsStatsLoading(false)
    }
  }
  
  const fetchActivity = async () => {
    setIsActivityLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(apiEndpoint("admin/activity"), {
        headers: { Authorization: `Bearer ${token}` }
      })
      setActivities(response.data)
    } catch (error) {
      console.error("Error fetching activity:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load activity data. Please try refreshing the page.",
      })
    } finally {
      setIsActivityLoading(false)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase()
    setSearchQuery(query)
    
    if (query.trim() === "") {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(
        user => 
          user.name.toLowerCase().includes(query) || 
          user.email.toLowerCase().includes(query)
      )
      setFilteredUsers(filtered)
    }
  }

  const toggleUserRole = async (userId: string, currentRole: string) => {
    try {
      const token = localStorage.getItem("token")
      const newRole = currentRole === "admin" ? "user" : "admin"
      
      await axios.put(
        apiEndpoint(`admin/users/${userId}/role`),
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      // Update local state
      const updatedUsers = users.map(user => 
        user._id === userId ? { ...user, role: newRole } : user
      )
      setUsers(updatedUsers)
      
      // Update filtered users
      const updatedFilteredUsers = filteredUsers.map(user => 
        user._id === userId ? { ...user, role: newRole } : user
      )
      setFilteredUsers(updatedFilteredUsers)
      
      // Update stats
      fetchUserStats()
      
      toast({
        title: "Role Updated",
        description: `User role has been updated to ${newRole}.`,
      })
    } catch (error) {
      console.error("Error updating user role:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user role. Please try again.",
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card className="md:col-span-1 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>
        <Card className="md:col-span-1 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users (30d)</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.newUsers}</div>
            <p className="text-xs text-muted-foreground">
              Users registered in the last 30 days
            </p>
          </CardContent>
        </Card>
        <Card className="md:col-span-1 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.adminUsers}</div>
            <p className="text-xs text-muted-foreground">
              Users with admin privileges
            </p>
          </CardContent>
        </Card>
        <Card className="md:col-span-1 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.projects.total}</div>
            <p className="text-xs text-muted-foreground">
              {systemStats.projects.new} new in last 30 days
            </p>
          </CardContent>
        </Card>
        <Card className="md:col-span-1 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks (30d)</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.tasks.new}</div>
            <p className="text-xs text-muted-foreground">
              {systemStats.tasks.newCompleted} completed
            </p>
          </CardContent>
        </Card>
        <Card className="md:col-span-1 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reflections</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.reflections.total}</div>
            <p className="text-xs text-muted-foreground">
              {systemStats.reflections.new} new in last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={handleSearch}
              className="max-w-sm"
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View and manage all registered users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">Loading users...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user._id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              user.role === "admin" 
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" 
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            }`}>
                              {user.role}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                              <span>{formatDate(user.createdAt)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleUserRole(user._id, user.role)}
                            >
                              {user.role === "admin" ? (
                                <>
                                  <ShieldOff className="mr-2 h-4 w-4" />
                                  Remove Admin
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="mr-2 h-4 w-4" />
                                  Make Admin
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>
                  Recent system activity across all users
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchActivity}
                disabled={isActivityLoading}
              >
                <Activity className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {isActivityLoading ? (
                <div className="flex justify-center py-8">Loading activity log...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          No activities found
                        </TableCell>
                      </TableRow>
                    ) : (
                      activities.map((activity, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                              <span>{formatDate(activity.timestamp)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {activity.user ? (
                              <div className="font-medium">{activity.user.name}</div>
                            ) : (
                              <div className="text-muted-foreground">System</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              activity.type === 'user_registered' 
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" 
                                : activity.type === 'project_created'
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : activity.type === 'task_completed'
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            }`}>
                              {activity.type.replace('_', ' ')}
                            </span>
                          </TableCell>
                          <TableCell>
                            {activity.type === 'user_registered' && (
                              <span>New user registered with role: {activity.details.role}</span>
                            )}
                            {activity.type === 'project_created' && (
                              <span>Project created: {activity.details.projectName}</span>
                            )}
                            {activity.type === 'task_completed' && (
                              <span>Task completed: {activity.details.taskTitle} in {activity.details.projectName}</span>
                            )}
                            {activity.type === 'reflection_created' && (
                              <span>Reflection created: {activity.details.reflectionTitle}</span>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
