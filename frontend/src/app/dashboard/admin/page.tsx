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
  Clock,
  LogIn,
  AlertTriangle,
  UserCheck,
  Filter,
  MessageSquare
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { apiEndpoint } from "@/config"
import { FeedbackTab } from "@/components/FeedbackTab"
import SubscriptionManagementTab from "@/components/SubscriptionManagementTab"
import TransactionsTab from "@/components/TransactionsTab"
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
  const [authLogs, setAuthLogs] = useState<any[]>([])
  const [isStatsLoading, setIsStatsLoading] = useState(true)
  const [isActivityLoading, setIsActivityLoading] = useState(true)
  const [isAuthLogsLoading, setIsAuthLogsLoading] = useState(true)
  const [authLogsPage, setAuthLogsPage] = useState(1)
  const [authLogsTotal, setAuthLogsTotal] = useState(0)
  const [authLogsFilter, setAuthLogsFilter] = useState({ type: '', email: '' })

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
      fetchAuthLogs()
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
  
  const fetchAuthLogs = async (page = 1, filters = { type: '', email: '' }) => {
    setIsAuthLogsLoading(true)
    try {
      const token = localStorage.getItem("token")
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50'
      })
      
      if (filters.type) params.append('type', filters.type)
      if (filters.email) params.append('email', filters.email)
      
      const response = await axios.get(
        apiEndpoint(`admin/activity-logs?${params.toString()}`), 
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      setAuthLogs(response.data.logs)
      setAuthLogsTotal(response.data.pagination.total)
      setAuthLogsPage(page)
    } catch (error) {
      console.error("Error fetching auth logs:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load authentication logs. Please try refreshing the page.",
      })
    } finally {
      setIsAuthLogsLoading(false)
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
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="auth-logs">Authentication Logs</TabsTrigger>
          <TabsTrigger value="feedback">User Feedback</TabsTrigger>
        </TabsList>
        <TabsContent value="subscriptions" className="space-y-4">
          <SubscriptionManagementTab />
        </TabsContent>
        <TabsContent value="transactions" className="space-y-4">
          <TransactionsTab />
        </TabsContent>
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
        
        <TabsContent value="auth-logs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Authentication Logs</CardTitle>
                <CardDescription>
                  Login, registration, and authentication activity
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setAuthLogsFilter({ type: '', email: '' })
                    fetchAuthLogs(1, { type: '', email: '' })
                  }}
                  disabled={isAuthLogsLoading}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchAuthLogs(authLogsPage, authLogsFilter)}
                  disabled={isAuthLogsLoading}
                >
                  <Activity className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <Button 
                  variant={authLogsFilter.type === '' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => {
                    const newFilter = { ...authLogsFilter, type: '' }
                    setAuthLogsFilter(newFilter)
                    fetchAuthLogs(1, newFilter)
                  }}
                >
                  All
                </Button>
                <Button 
                  variant={authLogsFilter.type === 'login' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => {
                    const newFilter = { ...authLogsFilter, type: 'login' }
                    setAuthLogsFilter(newFilter)
                    fetchAuthLogs(1, newFilter)
                  }}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Successful Logins
                </Button>
                <Button 
                  variant={authLogsFilter.type === 'login_failed' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => {
                    const newFilter = { ...authLogsFilter, type: 'login_failed' }
                    setAuthLogsFilter(newFilter)
                    fetchAuthLogs(1, newFilter)
                  }}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Failed Logins
                </Button>
                <Button 
                  variant={authLogsFilter.type === 'register' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => {
                    const newFilter = { ...authLogsFilter, type: 'register' }
                    setAuthLogsFilter(newFilter)
                    fetchAuthLogs(1, newFilter)
                  }}
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  Registrations
                </Button>
              </div>
              
              {isAuthLogsLoading ? (
                <div className="flex justify-center py-8">Loading authentication logs...</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>User/Email</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {authLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">
                            No authentication logs found
                          </TableCell>
                        </TableRow>
                      ) : (
                        authLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>{formatDate(log.timestamp)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                log.type === 'login' 
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                                  : log.type === 'login_failed'
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                  : log.type === 'register'
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                              }`}>
                                {log.type.replace('_', ' ')}
                              </span>
                            </TableCell>
                            <TableCell>
                              {log.user ? (
                                <div className="font-medium">{log.user.name} ({log.user.email})</div>
                              ) : (
                                <div>{log.email || 'Unknown'}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              {log.ipAddress}
                            </TableCell>
                            <TableCell>
                              {log.details}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                log.success
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                              }`}>
                                {log.success ? 'Success' : 'Failed'}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination */}
                  {authLogsTotal > 0 && (
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {authLogs.length} of {authLogsTotal} logs
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchAuthLogs(authLogsPage - 1, authLogsFilter)}
                          disabled={authLogsPage === 1 || isAuthLogsLoading}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchAuthLogs(authLogsPage + 1, authLogsFilter)}
                          disabled={authLogsPage * 50 >= authLogsTotal || isAuthLogsLoading}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="feedback">
          <FeedbackTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
