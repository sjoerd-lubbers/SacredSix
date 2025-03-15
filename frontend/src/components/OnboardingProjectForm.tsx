"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

// Define the schema for project form validation
export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  tags: z.string().optional(),
})

export type ProjectFormValues = z.infer<typeof projectSchema>

interface OnboardingProjectFormProps {
  defaultValues?: ProjectFormValues
  onSubmit: (data: ProjectFormValues) => Promise<void>
  isSubmitting: boolean
  submitLabel: string
  submittingLabel: string
  formRef?: React.RefObject<HTMLFormElement>
  onChange?: (field: string, value: string) => void
}

export default function OnboardingProjectForm({
  defaultValues = {
    name: "",
    description: "",
    tags: "",
  },
  onSubmit,
  isSubmitting,
  submitLabel,
  submittingLabel,
  formRef,
  onChange
}: OnboardingProjectFormProps) {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues,
  })

  const handleSubmit = async (data: ProjectFormValues) => {
    await onSubmit(data)
  }

  return (
    <Form {...form}>
      <form 
        ref={formRef}
        onSubmit={form.handleSubmit(handleSubmit)} 
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter project name" 
                  {...field} 
                  onChange={(e) => {
                    field.onChange(e);
                    onChange?.('name', e.target.value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter project description" 
                  {...field} 
                  onChange={(e) => {
                    field.onChange(e);
                    onChange?.('description', e.target.value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter tags separated by commas (e.g. sacred six, work, personal)" 
                  {...field} 
                  onChange={(e) => {
                    field.onChange(e);
                    onChange?.('tags', e.target.value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* No submit button - will be handled by parent component */}
      </form>
    </Form>
  )
}
