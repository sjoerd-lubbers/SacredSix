"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "@/lib/userStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, CreditCard, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { apiEndpoint } from "@/config";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SubscriptionInfo() {
  const { user, updateSubscription, loadUser } = useUserStore();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<'monthly' | 'yearly'>('monthly');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check for payment success parameter
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const paymentId = searchParams.get('id');
    
    if (paymentStatus === 'success') {
      // If we have a payment ID, check its status
      if (paymentId) {
        checkPaymentStatus(paymentId);
      } else {
        // Otherwise just refresh user data
        loadUser();
        toast({
          title: "Payment successful",
          description: "Your premium subscription has been activated!",
        });
      }
      
      // Remove the payment parameter from the URL
      const url = new URL(window.location.href);
      url.searchParams.delete('payment');
      url.searchParams.delete('id');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, loadUser, toast]);
  
  // Function to check payment status
  const checkPaymentStatus = async (paymentId: string) => {
    try {
      // Refresh user data to get updated subscription status
      await loadUser();
      
      toast({
        title: "Payment processing",
        description: "Your payment is being processed. Your subscription will be updated shortly.",
      });
    } catch (error) {
      console.error('Error refreshing user data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh data. Please try again.",
      });
    }
  };
  
  // Function to refresh user data
  const refreshUserData = async () => {
    setIsRefreshing(true);
    try {
      await loadUser();
      toast({
        title: "Data refreshed",
        description: "Your subscription information has been updated.",
      });
    } catch (error) {
      console.error('Error refreshing user data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh data. Please try again.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Function to initiate payment with Mollie
  const initiatePayment = async () => {
    setIsUpdating(true);
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "Please log in again to continue.",
        });
        return;
      }
      
      // Create payment
      const response = await axios.post(
        apiEndpoint('payments/create'),
        {
          plan: subscriptionPlan
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Redirect to Mollie payment page
      if (response.data && response.data.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      } else {
        throw new Error('Invalid payment response');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast({
        variant: "destructive",
        title: "Payment error",
        description: "Failed to initiate payment. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Format the subscription valid until date if it exists
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Determine if subscription is active (for premium users)
  const isSubscriptionActive = () => {
    if (user?.subscription === "free") return true; // Free is always active
    if (!user?.subscriptionValidUntil) return false;
    
    const validUntil = new Date(user.subscriptionValidUntil);
    const now = new Date();
    return validUntil > now;
  };
  
  // Calculate the new expiration date based on the current subscription and selected plan
  const getNewExpirationDate = () => {
    // Start with the current expiration date or today if expired
    let baseDate;
    if (user?.subscriptionValidUntil && isSubscriptionActive()) {
      baseDate = new Date(user.subscriptionValidUntil);
    } else {
      baseDate = new Date();
    }
    
    // Create a new date object to avoid modifying the original
    const newDate = new Date(baseDate);
    
    // Add months based on the selected plan
    if (subscriptionPlan === 'monthly') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 12);
    }
    
    return newDate.toISOString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Subscription</CardTitle>
        <CardDescription>
          Manage your subscription plan and payment details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Current Plan</h3>
          <div className="rounded-md border p-4">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  {user?.subscription === "premium" ? "Premium Plan" : "Free Plan"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {user?.subscription === "premium" ? (
                    <div className="flex items-center">
                      <CalendarIcon className="mr-1 h-4 w-4" />
                      <span>
                        {isSubscriptionActive() 
                          ? `Valid until ${formatDate(user?.subscriptionValidUntil)}`
                          : "Expired"}
                      </span>
                    </div>
                  ) : (
                    "Limited features"
                  )}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {user?.subscription === "premium" 
                  ? "6 sacred projects and unlimited other projects"
                  : "Up to 3 sacred projects and 3 other projects"}
              </div>
              
              {/* Renew button for premium users with active subscription */}
              {user?.subscription === "premium" && isSubscriptionActive() && (
                <div className="pt-2 border-t mt-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Renew Subscription
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Renew Your Premium Subscription</AlertDialogTitle>
                        <AlertDialogDescription>
                          Extend your premium subscription before it expires on {formatDate(user?.subscriptionValidUntil)}.
                          
                          <div className="mt-4 space-y-4">
                            <RadioGroup 
                              value={subscriptionPlan} 
                              onValueChange={(value) => setSubscriptionPlan(value as 'monthly' | 'yearly')}
                              className="space-y-3"
                            >
                              <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted">
                                <RadioGroupItem value="monthly" id="extend-monthly" />
                                <Label htmlFor="extend-monthly" className="flex-1 cursor-pointer">
                                  <div className="font-medium">Monthly Plan</div>
                                  <div className="text-sm text-muted-foreground">€9.99 for 1 month</div>
                                </Label>
                                <div className="font-medium">€9.99</div>
                              </div>
                              
                              <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted">
                                <RadioGroupItem value="yearly" id="extend-yearly" />
                                <Label htmlFor="extend-yearly" className="flex-1 cursor-pointer">
                                  <div className="font-medium">Yearly Plan</div>
                                  <div className="text-sm text-muted-foreground">€99.99 for 12 months (Save 16%)</div>
                                </Label>
                                <div className="font-medium">€99.99</div>
                              </div>
                            </RadioGroup>
                          </div>
                          
                          <div className="mt-4 p-3 bg-muted rounded-md">
                            <h4 className="text-sm font-medium mb-1">Subscription Extension Details:</h4>
                            <p className="text-sm">
                              Your subscription will be extended by {subscriptionPlan === 'monthly' ? '1 month' : '12 months'}.
                            </p>
                            <p className="text-sm font-medium mt-2">
                              New expiration date: {formatDate(getNewExpirationDate())}
                            </p>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={initiatePayment}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            "Continue to Payment"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Plan Features section removed as requested */}

        {user?.subscription === "free" ? (
          <div className="pt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                  <Button className="w-full">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Upgrade to Premium
                  </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Upgrade to Premium</AlertDialogTitle>
                  <AlertDialogDescription>
                    Choose your subscription plan:
                    
                    <div className="mt-4 space-y-4">
                      <RadioGroup 
                        value={subscriptionPlan} 
                        onValueChange={(value) => setSubscriptionPlan(value as 'monthly' | 'yearly')}
                        className="space-y-3"
                      >
                        <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted">
                          <RadioGroupItem value="monthly" id="monthly" />
                          <Label htmlFor="monthly" className="flex-1 cursor-pointer">
                            <div className="font-medium">Monthly Plan</div>
                            <div className="text-sm text-muted-foreground">€9.99 per month</div>
                          </Label>
                          <div className="font-medium">€9.99</div>
                        </div>
                        
                        <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted">
                          <RadioGroupItem value="yearly" id="yearly" />
                          <Label htmlFor="yearly" className="flex-1 cursor-pointer">
                            <div className="font-medium">Yearly Plan</div>
                            <div className="text-sm text-muted-foreground">€99.99 per year (Save 16%)</div>
                          </Label>
                          <div className="font-medium">€99.99</div>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Premium features include:</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>6 sacred projects (instead of 3)</li>
                        <li>Unlimited other projects</li>
                        <li>All premium features</li>
                      </ul>
                    </div>
                    
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <h4 className="text-sm font-medium mb-1">Subscription Details:</h4>
                        <p className="text-sm">
                          Your subscription will be valid for {subscriptionPlan === 'monthly' ? '1 month' : '12 months'}.
                        </p>
                        <p className="text-sm font-medium mt-2">
                          Expiration date: {formatDate(getNewExpirationDate())}
                        </p>
                      </div>
                    
                    <p className="mt-2 text-sm">
                      You will be redirected to our payment provider to complete the transaction.
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={initiatePayment}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Continue to Payment"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* For expired premium subscriptions, show renew button */}
            {!isSubscriptionActive() && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Renew Premium
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Renew Premium Subscription</AlertDialogTitle>
                    <AlertDialogDescription>
                      Your premium subscription has expired. Choose a plan to renew:
                      
                      <div className="mt-4 space-y-4">
                        <RadioGroup 
                          value={subscriptionPlan} 
                          onValueChange={(value) => setSubscriptionPlan(value as 'monthly' | 'yearly')}
                          className="space-y-3"
                        >
                          <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted">
                            <RadioGroupItem value="monthly" id="renew-monthly" />
                            <Label htmlFor="renew-monthly" className="flex-1 cursor-pointer">
                              <div className="font-medium">Monthly Plan</div>
                              <div className="text-sm text-muted-foreground">€9.99 per month</div>
                            </Label>
                            <div className="font-medium">€9.99</div>
                          </div>
                          
                          <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted">
                            <RadioGroupItem value="yearly" id="renew-yearly" />
                            <Label htmlFor="renew-yearly" className="flex-1 cursor-pointer">
                              <div className="font-medium">Yearly Plan</div>
                              <div className="text-sm text-muted-foreground">€99.99 per year (Save 16%)</div>
                            </Label>
                            <div className="font-medium">€99.99</div>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Premium features include:</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li>6 sacred projects (instead of 3)</li>
                          <li>Unlimited other projects</li>
                          <li>All premium features</li>
                        </ul>
                      </div>
                      
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <h4 className="text-sm font-medium mb-1">Subscription Details:</h4>
                        <p className="text-sm">
                          Your subscription will be valid for {subscriptionPlan === 'monthly' ? '1 month' : '12 months'}.
                        </p>
                        <p className="text-sm font-medium mt-2">
                          Expiration date: {formatDate(getNewExpirationDate())}
                        </p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={initiatePayment}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Continue to Payment"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            
            {/* Downgrade button removed as requested */}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
