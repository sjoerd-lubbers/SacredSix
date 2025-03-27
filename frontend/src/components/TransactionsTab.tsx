"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Search, Loader2, RefreshCw, Calendar, CreditCard, Clock, DollarSign } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface Transaction {
  _id: string;
  paymentId: string;
  userId: string;
  userEmail: string;
  amount: {
    currency: string;
    value: string;
  };
  description: string;
  status: string;
  plan: string;
  months: number;
  orderId: string;
  createdAt: string;
  updatedAt: string;
}

export default function TransactionsTab() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async (page = 1) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(apiEndpoint(`payments/transactions?page=${page}&limit=10`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTransactions(response.data.transactions);
      setFilteredTransactions(response.data.transactions);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch transactions. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (query.trim() === "") {
      setFilteredTransactions(transactions);
    } else {
      const filtered = transactions.filter(
        transaction => 
          transaction.userEmail.toLowerCase().includes(query) || 
          transaction.paymentId.toLowerCase().includes(query) ||
          transaction.orderId.toLowerCase().includes(query)
      );
      setFilteredTransactions(filtered);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "PPP p");
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'created':
      case 'pending':
        return 'default';
      case 'canceled':
      case 'expired':
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Transactions</CardTitle>
        <CardDescription>
          View all payment transactions and their statuses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, payment ID, or order ID..."
            value={searchQuery}
            onChange={handleSearch}
            className="max-w-sm"
          />
          <Button 
            variant="outline" 
            onClick={() => fetchTransactions(pagination.page)}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">Loading transactions...</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(transaction.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{transaction.userEmail}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="text-xs">{transaction.paymentId}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {transaction.plan === 'yearly' ? 'Yearly' : 'Monthly'} ({transaction.months} {transaction.months === 1 ? 'month' : 'months'})
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <DollarSign className="mr-1 h-4 w-4 text-muted-foreground" />
                          <span>{transaction.amount.value} {transaction.amount.currency}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(transaction.status) as any}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </Badge>
                        {transaction.updatedAt !== transaction.createdAt && (
                          <div className="flex items-center mt-1 text-xs text-muted-foreground">
                            <Clock className="mr-1 h-3 w-3" />
                            <span>Updated: {formatDate(transaction.updatedAt)}</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            {pagination.total > 0 && (
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredTransactions.length} of {pagination.total} transactions
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTransactions(pagination.page - 1)}
                    disabled={pagination.page === 1 || isLoading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTransactions(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages || isLoading}
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
  );
}
