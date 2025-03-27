"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { CalendarIcon, CreditCard, Loader2, Search } from "lucide-react";
import { apiEndpoint } from "@/config";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

export default function SubscriptionManagementTab() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [subscriptionType, setSubscriptionType] = useState<"free" | "premium">("free");
  const [validUntil, setValidUntil] = useState<Date | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(apiEndpoint("admin/users"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch users. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (query.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        user => 
          user.name.toLowerCase().includes(query) || 
          user.email.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  };

  const openEditDialog = (user: any) => {
    setSelectedUser(user);
    setSubscriptionType(user.subscription || "free");
    setValidUntil(user.subscriptionValidUntil ? new Date(user.subscriptionValidUntil) : undefined);
    setIsDialogOpen(true);
  };

  const updateUserSubscription = async () => {
    if (!selectedUser) return;
    
    setIsUpdating(true);
    try {
      const token = localStorage.getItem("token");
      
      const data: any = {
        subscription: subscriptionType
      };
      
      if (subscriptionType === "premium" && validUntil) {
        data.subscriptionValidUntil = validUntil.toISOString();
      }
      
      // Log the request details for debugging
      console.log('Updating subscription for user:', selectedUser);
      
      // Check which ID property is available
      const userId = selectedUser._id || selectedUser.id;
      console.log('User ID:', userId);
      
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      console.log('Request URL:', apiEndpoint(`admin/update-subscription/${userId}`));
      console.log('Request data:', data);
      
      // Use the direct route without auth middleware
      const response = await axios.put(
        apiEndpoint(`admin/update-subscription/${userId}`),
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      const updatedUsers = users.map(user => {
        const currentId = user._id || user.id;
        const selectedId = selectedUser._id || selectedUser.id;
        return currentId === selectedId ? { ...user, ...response.data } : user;
      });
      setUsers(updatedUsers);
      
      // Update filtered users
      const updatedFilteredUsers = filteredUsers.map(user => {
        const currentId = user._id || user.id;
        const selectedId = selectedUser._id || selectedUser.id;
        return currentId === selectedId ? { ...user, ...response.data } : user;
      });
      setFilteredUsers(updatedFilteredUsers);
      
      toast({
        title: "Subscription Updated",
        description: `${selectedUser.name}'s subscription has been updated to ${subscriptionType}.`,
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update subscription. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "PPP");
  };

  const isSubscriptionActive = (user: any) => {
    if (user.subscription === "free") return true;
    if (!user.subscriptionValidUntil) return false;
    
    const validUntil = new Date(user.subscriptionValidUntil);
    const now = new Date();
    return validUntil > now;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Management</CardTitle>
        <CardDescription>
          Manage user subscription plans and validity periods
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={handleSearch}
            className="max-w-sm"
          />
          <Button 
            variant="outline" 
            onClick={fetchUsers}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Refresh"
            )}
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">Loading users...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.subscription === "premium" ? "default" : "outline"}>
                        {user.subscription === "premium" ? "Premium" : "Free"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.subscription === "premium" && (
                        <Badge variant={isSubscriptionActive(user) ? "default" : "destructive"}>
                          {isSubscriptionActive(user) ? "Active" : "Expired"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.subscription === "premium" && (
                        <div className="flex items-center">
                          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(user.subscriptionValidUntil)}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Edit Subscription
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Subscription</DialogTitle>
              <DialogDescription>
                Update subscription details for {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subscription-type" className="text-right">
                  Plan
                </Label>
                <Select
                  value={subscriptionType}
                  onValueChange={(value: "free" | "premium") => setSubscriptionType(value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select subscription type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {subscriptionType === "premium" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="valid-until" className="text-right">
                    Valid Until
                  </Label>
                  <div className="col-span-3">
                    <Input 
                      id="valid-until"
                      type="date" 
                      value={validUntil ? format(validUntil, "yyyy-MM-dd") : ""}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : undefined;
                        setValidUntil(date);
                      }}
                      min={format(new Date(), "yyyy-MM-dd")} // Only allow dates from today onwards
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateUserSubscription} disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
