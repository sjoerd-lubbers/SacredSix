"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { DAILY_QUESTIONS, WEEKLY_QUESTIONS, ReflectionQuestion } from "./ReflectionHelpers"
import { CalendarDays, Calendar } from "lucide-react"

interface QuestionAnswer {
  question: string;
  answer: string;
}

// Update the schema to use questionAnswers
const reflectionSchema = z.object({
  type: z.enum(["daily", "weekly"]),
  questionAnswers: z.array(
    z.object({
      question: z.string(),
      answer: z.string()
    })
  )
})

type ReflectionFormValues = z.infer<typeof reflectionSchema>

interface NewReflectionDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (data: ReflectionFormValues) => void
  isSubmitting: boolean
  defaultType?: "daily" | "weekly"
}

export const NewReflectionDialog: React.FC<NewReflectionDialogProps> = ({
  isOpen,
  onOpenChange,
  onCreate,
  isSubmitting,
  defaultType = "daily"
}) => {
  // State to track if we're in type selection mode or question answering mode
  const [isTypeSelectionMode, setIsTypeSelectionMode] = useState(true);
  
  // Helper to create default question-answer pairs for a type
  const createDefaultQuestionAnswers = (type: 'daily' | 'weekly'): QuestionAnswer[] => {
    const questions = type === 'daily' ? DAILY_QUESTIONS : WEEKLY_QUESTIONS;
    return questions.map(questionObj => ({
      question: questionObj.question,
      answer: ''
    }));
  };

  const [questionAnswers, setQuestionAnswers] = useState<QuestionAnswer[]>(
    createDefaultQuestionAnswers(defaultType)
  );

  const [currentType, setCurrentType] = useState<'daily' | 'weekly'>(defaultType);
  const questionObjects = currentType === 'daily' ? DAILY_QUESTIONS : WEEKLY_QUESTIONS;

  const form = useForm<ReflectionFormValues>({
    resolver: zodResolver(reflectionSchema),
    defaultValues: {
      type: defaultType,
      questionAnswers: createDefaultQuestionAnswers(defaultType)
    },
  });

  // Handle question-answer changes
  const handleQuestionAnswersChange = (newQA: QuestionAnswer[]) => {
    setQuestionAnswers(newQA);
    form.setValue("questionAnswers", newQA);
  };

  // Handle type selection
  const handleTypeSelect = (type: 'daily' | 'weekly') => {
    setCurrentType(type);
    // Create new question-answer pairs for the selected type
    const newQA = createDefaultQuestionAnswers(type);
    setQuestionAnswers(newQA);
    form.setValue("type", type);
    form.setValue("questionAnswers", newQA);
    
    // Move to question answering mode
    setIsTypeSelectionMode(false);
  };

  const handleFormSubmit = (data: ReflectionFormValues) => {
    console.log("Creating new reflection with data:", data);
    onCreate(data);
  };

  // Reset the dialog state when it's closed
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      // Reset to type selection mode for next time
      setIsTypeSelectionMode(true);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Reflection</DialogTitle>
        </DialogHeader>
        
        {isTypeSelectionMode ? (
          // Type Selection View
          <div className="py-4">
            <p className="text-center text-muted-foreground mb-6">
              Choose the type of reflection you want to create:
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div 
                className="flex flex-col items-center justify-center p-6 border rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                onClick={() => handleTypeSelect('daily')}
              >
                <CalendarDays className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-lg font-medium">Daily</h3>
                <p className="text-sm text-center text-muted-foreground mt-2">
                  Reflect on today's accomplishments and challenges
                </p>
              </div>
              
              <div 
                className="flex flex-col items-center justify-center p-6 border rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                onClick={() => handleTypeSelect('weekly')}
              >
                <Calendar className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-lg font-medium">Weekly</h3>
                <p className="text-sm text-center text-muted-foreground mt-2">
                  Review your week and plan for the next one
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Question Answering View
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  {currentType === 'daily' ? 'Daily' : 'Weekly'} Reflection
                </h3>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsTypeSelectionMode(true)}
                >
                  Change Type
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-2">
                  Answer the following questions:
                </div>
                
                {questionAnswers.map((qa, index) => {
                  const questionObj = questionObjects[index];
                  return (
                    <div key={index} className="space-y-2">
                      <FormLabel>{qa.question}</FormLabel>
                      {questionObj.hint && (
                        <p className="text-xs text-muted-foreground mb-2 italic">
                          {questionObj.hint}
                        </p>
                      )}
                      <textarea
                        className="w-full min-h-[100px] p-2 border rounded-md"
                        value={qa.answer}
                        onChange={(e) => {
                          const newQA = [...questionAnswers];
                          newQA[index].answer = e.target.value;
                          handleQuestionAnswersChange(newQA);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Reflection"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
