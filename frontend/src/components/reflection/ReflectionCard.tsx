"use client"

import React from "react"
import { format } from "date-fns"
import { BookOpen, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
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
} from "@/components/ui/alert-dialog"
import { extractQuestionAnswer } from "./ReflectionHelpers"

interface Reflection {
  _id: string
  content?: string
  type: 'daily' | 'weekly'
  questionAnswers?: {
    question: string;
    answer: string;
  }[];
  isStructured?: boolean;
  aiAnalysis?: string
  aiSuggestions?: string[]
  createdAt: string
  updatedAt: string
}

interface ReflectionCardProps {
  reflection: Reflection
  onView: (reflection: Reflection) => void
  onEdit: (reflection: Reflection) => void
  onDelete: (reflectionId: string) => void
}

export const ReflectionCard: React.FC<ReflectionCardProps> = ({
  reflection,
  onView,
  onEdit,
  onDelete
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "PPP")
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant={reflection.type === 'daily' ? 'default' : 'secondary'}>
            {reflection.type === 'daily' ? 'Daily' : 'Weekly'}
          </Badge>
          <div className="text-xs text-muted-foreground">
            {formatDate(reflection.createdAt)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="line-clamp-4 text-sm">
          {reflection.questionAnswers && reflection.questionAnswers.length > 0 ? (
            // For structured reflections with questionAnswers, show the first question and answer
            <div>
              <p className="font-medium">{reflection.questionAnswers[0].question}</p>
              <p>{reflection.questionAnswers[0].answer}</p>
            </div>
          ) : reflection.content && reflection.content.startsWith("### ") ? (
            // For legacy structured reflections without questionAnswers
            <div>
              {reflection.type === "daily" ? (
                <div>
                  <p className="font-medium">Wat ging vandaag goed?</p>
                  <p>{extractQuestionAnswer(reflection.content, "Wat ging vandaag goed?")}</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium">Welke successen heb ik deze week geboekt?</p>
                  <p>{extractQuestionAnswer(reflection.content, "Welke successen heb ik deze week geboekt?")}</p>
                </div>
              )}
            </div>
          ) : (
            // For legacy free-form reflections
            <p>{reflection.content || ""}</p>
          )}
        </div>
        {reflection.aiAnalysis && (
          <div className="mt-2">
            <Badge variant="outline" className="bg-primary/10">AI Analyzed</Badge>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onView(reflection)}
        >
          <BookOpen className="mr-2 h-4 w-4" /> View
        </Button>
        <div className="space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(reflection)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Reflection</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this reflection? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(reflection._id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
};
