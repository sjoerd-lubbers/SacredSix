import { useState } from "react";
import axios from "axios";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Share } from "lucide-react";

interface ShareTasksDialogProps {
  taskIds: string[];
  trigger?: React.ReactNode;
  onShareComplete?: () => void;
}

export default function ShareTasksDialog({ 
  taskIds, 
  trigger, 
  onShareComplete 
}: ShareTasksDialogProps) {
  const { toast } = useToast();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleShare = async () => {
    if (!recipientEmail) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter a recipient email address.",
      });
      return;
    }

    if (taskIds.length === 0) {
      toast({
        variant: "destructive",
        title: "No tasks selected",
        description: "Please select at least one task to share.",
      });
      return;
    }

    setIsSharing(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "Please log in again to share tasks.",
        });
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.post(
        "http://localhost:5000/api/sharing/share",
        {
          taskIds,
          recipientEmail,
          message
        },
        config
      );

      toast({
        title: "Tasks shared",
        description: `Tasks have been shared with ${recipientEmail}`,
      });

      // Reset form
      setRecipientEmail("");
      setMessage("");
      setIsOpen(false);

      // Call the callback if provided
      if (onShareComplete) {
        onShareComplete();
      }
    } catch (error) {
      console.error("Error sharing tasks:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to share tasks. Please try again.",
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="ml-2">
            <Share className="h-4 w-4 mr-2" /> Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Tasks</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="recipient-email" className="text-sm font-medium">
              Recipient Email
            </label>
            <Input
              id="recipient-email"
              type="email"
              placeholder="Enter email address"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">
              Message (Optional)
            </label>
            <Textarea
              id="message"
              placeholder="Add a personal message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Sharing {taskIds.length} task(s) with {recipientEmail || "..."}</p>
            <p className="mt-2">
              The recipient will receive an email with a link to view these tasks.
            </p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleShare} disabled={isSharing}>
            {isSharing ? "Sharing..." : "Share Tasks"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
