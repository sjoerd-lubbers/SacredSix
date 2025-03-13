"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { StructuredReflectionForm } from "./StructuredReflectionForm"

interface QuestionAnswer {
  question: string;
  answer: string;
}

interface Reflection {
  _id: string
  content?: string
  type: 'daily' | 'weekly'
  questionAnswers?: QuestionAnswer[];
  isStructured?: boolean
  aiAnalysis?: string
  aiSuggestions?: string[]
  createdAt: string
  updatedAt: string
}

// Define the questions for each reflection type
const DAILY_QUESTIONS = [
  "Wat ging vandaag goed?",
  "Wat had ik beter kunnen doen?",
  "Welke taak gaf me de meeste energie?"
];

const WEEKLY_QUESTIONS = [
  "Welke successen heb ik deze week geboekt?",
  "Wat heb ik geleerd?",
  "Welke drie prioriteiten stel ik voor de volgende week?"
];

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

interface ReflectionEditDialogProps {
  reflection: Reflection | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (data: ReflectionFormValues) => void
  isSubmitting: boolean
}

export const ReflectionEditDialog: React.FC<ReflectionEditDialogProps> = ({
  reflection,
  isOpen,
  onOpenChange,
  onUpdate,
  isSubmitting
}) => {
  const [questionAnswers, setQuestionAnswers] = useState<QuestionAnswer[]>([]);

  const form = useForm<ReflectionFormValues>({
    resolver: zodResolver(reflectionSchema),
    defaultValues: {
      type: "daily",
      questionAnswers: []
    },
  });

  // Helper to create default question-answer pairs for a type
  const createDefaultQuestionAnswers = (type: 'daily' | 'weekly'): QuestionAnswer[] => {
    const questions = type === 'daily' ? DAILY_QUESTIONS : WEEKLY_QUESTIONS;
    return questions.map(question => ({
      question,
      answer: ''
    }));
  };

  useEffect(() => {
    if (reflection) {
      console.log("Loading reflection for editing:", reflection);
      
      let qaToUse: QuestionAnswer[] = [];
      
      // If the reflection has questionAnswers, use them
      if (reflection.questionAnswers && reflection.questionAnswers.length > 0) {
        console.log("Using questionAnswers from reflection:", reflection.questionAnswers);
        qaToUse = reflection.questionAnswers;
      } 
      // Otherwise create default question-answer pairs
      else {
        console.log("Creating default questionAnswers");
        qaToUse = createDefaultQuestionAnswers(reflection.type);
      }
      
      setQuestionAnswers(qaToUse);
      
      // Set the form values
      form.reset({
        type: reflection.type,
        questionAnswers: qaToUse
      });
    }
  }, [reflection, form]);

  // Handle question-answer changes
  const handleQuestionAnswersChange = (newQA: QuestionAnswer[]) => {
    setQuestionAnswers(newQA);
    form.setValue("questionAnswers", newQA);
  };

  // Handle type change
  const handleTypeChange = (type: 'daily' | 'weekly') => {
    // Create new question-answer pairs for the selected type
    const newQA = createDefaultQuestionAnswers(type);
    setQuestionAnswers(newQA);
    form.setValue("questionAnswers", newQA);
  };

  // Update the form submission
  const handleFormSubmit = (data: ReflectionFormValues) => {
    console.log("Submitting reflection with data:", data);
    onUpdate(data);
  };

  if (!reflection) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Reflection</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reflection Type</FormLabel>
                  <Select 
                    onValueChange={(value: 'daily' | 'weekly') => {
                      field.onChange(value);
                      handleTypeChange(value);
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4">
              <FormLabel>Reflection</FormLabel>
              <div className="text-sm text-muted-foreground mb-2">
                Answer the following questions:
              </div>
              
              {questionAnswers.map((qa, index) => (
                <div key={index} className="space-y-2">
                  <FormLabel>{qa.question}</FormLabel>
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
              ))}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Reflection"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
