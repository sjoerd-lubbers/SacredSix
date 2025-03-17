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
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"

// Define the schema for project form validation
export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  tags: z.string().optional(),
  isSacred: z.boolean().optional().default(false),
})

export type ProjectFormValues = z.infer<typeof projectSchema>

interface ProjectFormProps {
  defaultValues?: ProjectFormValues
  onSubmit: (data: ProjectFormValues) => Promise<void>
  isSubmitting: boolean
  submitLabel: string
  submittingLabel: string
  disableSacredCheckbox?: boolean
  disabledSacredMessage?: string
}

export default function ProjectForm({
  defaultValues = {
    name: "",
    description: "",
    tags: "",
    isSacred: false,
  },
  onSubmit,
  isSubmitting,
  submitLabel,
  submittingLabel,
  disableSacredCheckbox = false,
  disabledSacredMessage = "Maximum of 6 sacred projects reached"
}: ProjectFormProps) {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues,
  })

  const handleSubmit = async (data: ProjectFormValues) => {
    await onSubmit(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter project name" {...field} />
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
                <Textarea placeholder="Enter project description" {...field} />
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
                <Input placeholder="Enter tags separated by commas" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isSacred"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disableSacredCheckbox && !field.value}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Sacred Project</FormLabel>
                <FormDescription>
                  Mark this as one of your sacred 6 projects
                  {disableSacredCheckbox && (
                    <div className="mt-1 text-amber-600 text-xs">
                      {disabledSacredMessage}
                    </div>
                  )}
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? submittingLabel : submitLabel}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
