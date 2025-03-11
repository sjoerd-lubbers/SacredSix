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
import { Share, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ShareProjectDialogProps {
  projectId: string;
  projectName: string;
  trigger?: React.ReactNode;
  onShareComplete?: () => void;
}

export default function ShareProjectDialog({ 
  projectId, 
  projectName,
  trigger, 
  onShareComplete 
}: ShareProjectDialogProps) {
  const { toast } = useToast();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [role, setRole] = useState("viewer");
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

    if (!projectId) {
      toast({
        variant: "destructive",
        title: "No project selected",
        description: "Please select a project to share.",
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
          description: "Please log in again to share projects.",
        });
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Add collaborator directly to the project
      const response = await axios.put(
        `http://localhost:5000/api/projects/${projectId}/collaborators`,
        {
          email: recipientEmail,
          role
        },
        config
      );

      // Also send an email notification
      await axios.post(
        "http://localhost:5000/api/project-sharing/share",
        {
          projectId,
          recipientEmail,
          message
        },
        config
      );

      toast({
        title: "Project shared",
        description: `Project "${projectName}" has been shared with ${recipientEmail}`,
      });

      // Reset form
      setRecipientEmail("");
      setRole("viewer");
      setMessage("");
      setIsOpen(false);

      // Call the callback if provided
      if (onShareComplete) {
        onShareComplete();
      }
    } catch (error: any) {
      console.error("Error sharing project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to share project. Please try again.",
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
            <Users className="h-4 w-4 mr-2" /> Share Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Project</DialogTitle>
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
            <label htmlFor="role" className="text-sm font-medium">
              Permission Level
            </label>
            <Select
              value={role}
              onValueChange={setRole}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer (can only view)</SelectItem>
                <SelectItem value="editor">Editor (can edit tasks)</SelectItem>
                <SelectItem value="admin">Admin (can edit project and invite others)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Choose what the recipient will be able to do with this project
            </p>
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
            <p>Sharing project "{projectName}" with {recipientEmail || "..."}</p>
            <p className="mt-2">
              The recipient will receive an email with instructions to access this project.
            </p>
            <p className="mt-2">
              If they already have a Sacred Six account, they can accept the project.
              If not, they'll be invited to create an account.
            </p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleShare} disabled={isSharing}>
            {isSharing ? "Sharing..." : "Share Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
