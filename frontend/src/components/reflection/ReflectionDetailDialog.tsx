"use client"

import React from "react"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog"
import { FormattedReflection } from "./FormattedReflection"

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

interface ReflectionDetailDialogProps {
  reflection: Reflection | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (reflection: Reflection) => void
  isAnalyzing: boolean
  onAnalyze: (reflection: Reflection) => void
}

export const ReflectionDetailDialog: React.FC<ReflectionDetailDialogProps> = ({
  reflection,
  isOpen,
  onOpenChange,
  onEdit,
  isAnalyzing,
  onAnalyze
}) => {
  if (!reflection) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "PPP")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <Badge variant={reflection.type === 'daily' ? 'default' : 'secondary'}>
              {reflection.type === 'daily' ? 'Daily' : 'Weekly'} Reflection
            </Badge>
            <div className="text-sm text-muted-foreground">
              {formatDate(reflection.createdAt)}
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h4 className="mb-2 font-medium">Reflection</h4>
            <div className="rounded-md bg-muted p-4">
              <FormattedReflection 
                content={reflection.content} 
                questionAnswers={reflection.questionAnswers} 
              />
            </div>
          </div>
          
          {reflection.aiAnalysis ? (
            <div>
              <div className="flex items-center justify-between">
                <h4 className="font-medium">AI Analysis</h4>
                <Badge variant="outline" className="bg-primary/10">AI Insights</Badge>
              </div>
              <div className="mt-2 rounded-md bg-muted p-4">
                <p className="whitespace-pre-wrap text-sm">
                  {reflection.aiAnalysis}
                </p>
              </div>
              
              {reflection.aiSuggestions && reflection.aiSuggestions.length > 0 && (
                <div className="mt-4">
                  <h4 className="mb-2 font-medium">Suggestions</h4>
                  <ul className="space-y-2">
                    {reflection.aiSuggestions.map((suggestion, index) => (
                      <li key={index} className="rounded-md bg-muted p-3 text-sm">
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center">
              <h4 className="mb-2 font-medium">Get AI Insights</h4>
              <p className="mb-4 text-sm text-muted-foreground">
                Let AI analyze your reflection to provide insights and suggestions.
              </p>
              <Button 
                onClick={() => onAnalyze(reflection)} 
                disabled={isAnalyzing}
              >
                {isAnalyzing ? "Analyzing..." : "Analyze with AI"}
              </Button>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              onEdit(reflection);
              onOpenChange(false);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
