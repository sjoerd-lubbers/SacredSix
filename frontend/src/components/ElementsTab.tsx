"use client"

import { useState, useEffect } from "react"
import { Target, Heart } from "lucide-react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
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
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { apiEndpoint } from "@/config";

const sacredSixFormSchema = z.object({
  mission: z.string().min(10, {
    message: "Mission should be at least 10 characters.",
  }).max(500, {
    message: "Mission should not exceed 500 characters."
  }).optional(),
  values: z.array(z.string()).min(1, {
    message: "Please add at least one value."
  }).max(10, {
    message: "You can add up to 10 values."
  }).optional(),
})

type SacredSixFormValues = z.infer<typeof sacredSixFormSchema>

export default function ElementsTab() {
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [newValue, setNewValue] = useState("")
  const [values, setValues] = useState<string[]>([])

  const sacredSixForm = useForm<SacredSixFormValues>({
    resolver: zodResolver(sacredSixFormSchema),
    defaultValues: {
      mission: "",
      values: [],
    },
  })

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        
        // Initialize Sacred Six form if data exists
        if (parsedUser.mission || parsedUser.values) {
          sacredSixForm.reset({
            mission: parsedUser.mission || "",
            values: parsedUser.values || [],
          })
          
          setValues(parsedUser.values || [])
        }
      } catch (error) {
        console.error("Failed to parse user data:", error)
      }
    }
  }, [sacredSixForm])

  const onSacredSixSubmit = async (data: SacredSixFormValues) => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      // Call the API to update Sacred Six
      const response = await axios.put(
        apiEndpoint("auth/sacred-six"),
        data,
        config
      )
      
      // Update local storage
      const updatedUser = { ...user, ...data }
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setUser(updatedUser)
      
      toast({
        title: "Mission and Values updated",
        description: "Your Mission and Values have been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating Mission and Values:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update Mission and Values. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Mission and Values Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-blue-500" />
            Mission and Values
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...sacredSixForm}>
            <form onSubmit={sacredSixForm.handleSubmit(onSacredSixSubmit)} className="space-y-6">
              {/* Mission Section */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-blue-500" />
                  <h3 className="text-lg font-medium">Mission</h3>
                </div>
                <FormField
                  control={sacredSixForm.control}
                  name="mission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Mission Statement</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Example: My mission is to create technology that improves people's lives while maintaining a healthy work-life balance."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Values Section */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-red-500" />
                  <h3 className="text-lg font-medium">Values</h3>
                </div>
                <FormField
                  control={sacredSixForm.control}
                  name="values"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Core Values</FormLabel>
                      <div className="space-y-2">
                        <div className="flex">
                          <Input
                            placeholder="Add a value (e.g., Freedom, Growth, Creativity)"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            className="flex-1 mr-2"
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              if (newValue.trim()) {
                                const updatedValues = [...values, newValue.trim()];
                                setValues(updatedValues);
                                field.onChange(updatedValues);
                                setNewValue("");
                              }
                            }}
                            disabled={values.length >= 10}
                          >
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {values.map((value, index) => (
                            <div
                              key={index}
                              className="flex items-center bg-primary/10 text-primary rounded-full px-3 py-1"
                            >
                              <span>{value}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedValues = values.filter((_, i) => i !== index);
                                  setValues(updatedValues);
                                  field.onChange(updatedValues);
                                }}
                                className="ml-2 text-primary hover:text-primary/80"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Mission & Values"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
