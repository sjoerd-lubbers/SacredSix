"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react"
import axios from "axios"
import { apiEndpoint } from "@/config"

export function FeedbackDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [feedbackType, setFeedbackType] = useState<"positive" | "negative" | null>(null)
  const [feedbackText, setFeedbackText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!feedbackType) {
      toast({
        variant: "destructive",
        title: "Please select a feedback type",
        description: "Let us know if your experience was positive or negative",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication required")
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      await axios.post(
        apiEndpoint("feedback"), 
        {
          type: feedbackType,
          message: feedbackText,
          page: window.location.pathname,
          timestamp: new Date().toISOString()
        },
        config
      )

      toast({
        title: "Thank you for your feedback!",
        description: "We appreciate your input to help improve the application.",
      })

      // Reset and close
      setFeedbackType(null)
      setFeedbackText("")
      setIsOpen(false)
    } catch (error) {
      console.error("Error submitting feedback:", error)
      toast({
        variant: "destructive",
        title: "Error submitting feedback",
        description: "Please try again later.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickFeedback = async (type: "positive" | "negative") => {
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication required")
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      await axios.post(
        apiEndpoint("feedback"), 
        {
          type,
          message: "",
          page: window.location.pathname,
          timestamp: new Date().toISOString()
        },
        config
      )

      toast({
        title: "Thank you for your feedback!",
        description: type === "positive" ? "We're glad you're enjoying the app!" : "We'll work on improving your experience.",
      })
    } catch (error) {
      console.error("Error submitting quick feedback:", error)
      toast({
        variant: "destructive",
        title: "Error submitting feedback",
        description: "Please try again later.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Floating feedback button */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <div className="flex gap-2 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-green-100 dark:hover:bg-green-900"
            onClick={() => handleQuickFeedback("positive")}
            disabled={isSubmitting}
            title="I like this"
          >
            <ThumbsUp className="h-5 w-5 text-green-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-red-100 dark:hover:bg-red-900"
            onClick={() => handleQuickFeedback("negative")}
            disabled={isSubmitting}
            title="I don't like this"
          >
            <ThumbsDown className="h-5 w-5 text-red-600" />
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-blue-100 dark:hover:bg-blue-900"
                title="Give detailed feedback"
              >
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Share Your Feedback</DialogTitle>
                <DialogDescription>
                  Help us improve by sharing your thoughts about this feature.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex justify-center gap-4">
                  <Button
                    variant={feedbackType === "positive" ? "default" : "outline"}
                    className={feedbackType === "positive" ? "bg-green-600 hover:bg-green-700" : ""}
                    onClick={() => setFeedbackType("positive")}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Positive
                  </Button>
                  <Button
                    variant={feedbackType === "negative" ? "default" : "outline"}
                    className={feedbackType === "negative" ? "bg-red-600 hover:bg-red-700" : ""}
                    onClick={() => setFeedbackType("negative")}
                  >
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    Negative
                  </Button>
                </div>
                <Textarea
                  placeholder="Tell us what you think..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  )
}
