"use client"

import { useState, useEffect } from "react"
import { Target, Heart, Sparkles, Lightbulb, Quote, PenTool, Compass, Star } from "lucide-react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

  // Inspirational quotes for mission statements
  const missionQuotes = [
    {
      quote: "The purpose of life is not to be happy. It is to be useful, to be honorable, to be compassionate, to have it make some difference that you have lived and lived well.",
      author: "Ralph Waldo Emerson"
    },
    {
      quote: "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.",
      author: "Steve Jobs"
    },
    {
      quote: "The two most important days in your life are the day you are born and the day you find out why.",
      author: "Mark Twain"
    }
  ];

  // Example mission statements for inspiration
  const exampleMissions = [
    "To use my skills in technology to create tools that help people connect more meaningfully while maintaining a healthy work-life balance.",
    "To inspire others through creative expression and storytelling, bringing joy and new perspectives to people's lives.",
    "To build sustainable solutions that address environmental challenges while creating economic opportunities for communities."
  ];

  // Common value categories with examples
  const valueCategories = [
    {
      name: "Personal Growth",
      icon: <Sparkles className="h-4 w-4 mr-1" />,
      examples: ["Growth", "Learning", "Wisdom", "Curiosity", "Challenge"]
    },
    {
      name: "Relationships",
      icon: <Heart className="h-4 w-4 mr-1" />,
      examples: ["Family", "Connection", "Community", "Loyalty", "Empathy"]
    },
    {
      name: "Achievement",
      icon: <Star className="h-4 w-4 mr-1" />,
      examples: ["Success", "Excellence", "Mastery", "Ambition", "Recognition"]
    },
    {
      name: "Well-being",
      icon: <Compass className="h-4 w-4 mr-1" />,
      examples: ["Health", "Balance", "Peace", "Happiness", "Fulfillment"]
    }
  ];

  // Function to get a random color for value badges
  const getValueColor = (index: number) => {
    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-purple-100 text-purple-800",
      "bg-amber-100 text-amber-800",
      "bg-rose-100 text-rose-800",
      "bg-cyan-100 text-cyan-800",
      "bg-indigo-100 text-indigo-800",
      "bg-emerald-100 text-emerald-800"
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-8">
      <Tabs defaultValue="edit" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit" className="flex items-center">
            <PenTool className="h-4 w-4 mr-2" />
            Edit
          </TabsTrigger>
          <TabsTrigger value="inspiration" className="flex items-center">
            <Lightbulb className="h-4 w-4 mr-2" />
            Inspiration
          </TabsTrigger>
        </TabsList>
        
        {/* Edit Tab */}
        <TabsContent value="edit" className="space-y-6 pt-4">
          <Form {...sacredSixForm}>
            <form onSubmit={sacredSixForm.handleSubmit(onSacredSixSubmit)} className="space-y-8">
              {/* Mission Section */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2 text-blue-500" />
                    Personal Mission
                  </CardTitle>
                  <CardDescription>
                    Your mission statement defines your purpose and what you want to achieve in life
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <FormField
                    control={sacredSixForm.control}
                    name="mission"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-medium">Your Mission Statement</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Example: My mission is to create technology that improves people's lives while maintaining a healthy work-life balance."
                            className="min-h-[120px] text-base"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Values Section */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30">
                  <CardTitle className="flex items-center">
                    <Heart className="h-5 w-5 mr-2 text-rose-500" />
                    Core Values
                  </CardTitle>
                  <CardDescription>
                    Your core values guide your decisions and define what's most important to you
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <FormField
                    control={sacredSixForm.control}
                    name="values"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-medium">Your Core Values</FormLabel>
                        <div className="space-y-4">
                          <div className="flex">
                            <Input
                              placeholder="Add values separated by commas (e.g., Freedom, Growth, Creativity)"
                              value={newValue}
                              onChange={(e) => setNewValue(e.target.value)}
                              className="flex-1 mr-2"
                            />
                            <Button
                              type="button"
                              onClick={() => {
                                if (newValue.trim()) {
                                  // Split by comma and trim each value
                                  const valueArray = newValue
                                    .split(',')
                                    .map(v => v.trim())
                                    .filter(v => v.length > 0);
                                  
                                  // Add new values while respecting the 10 value limit
                                  const updatedValues = [...values];
                                  for (const value of valueArray) {
                                    if (updatedValues.length < 10) {
                                      updatedValues.push(value);
                                    } else {
                                      break;
                                    }
                                  }
                                  
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
                          
                          {values.length > 0 ? (
                            <div className="flex flex-wrap gap-2 mt-4 p-4 border rounded-lg bg-background">
                              {values.map((value, index) => (
                                <div
                                  key={index}
                                  className={`flex items-center rounded-full px-3 py-1.5 font-medium ${getValueColor(index)}`}
                                >
                                  <span>{value}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedValues = values.filter((_, i) => i !== index);
                                      setValues(updatedValues);
                                      field.onChange(updatedValues);
                                    }}
                                    className="ml-2 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center p-6 border border-dashed rounded-lg text-muted-foreground">
                              Add your core values above to see them here
                            </div>
                          )}
                          
                          <div className="text-sm text-muted-foreground mt-2">
                            {values.length}/10 values added
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-8"
                  size="lg"
                >
                  {isSaving ? "Saving..." : "Save Mission & Values"}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
        
        {/* Inspiration Tab */}
        <TabsContent value="inspiration" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Quote className="h-5 w-5 mr-2 text-purple-500" />
                Inspirational Quotes
              </CardTitle>
              <CardDescription>
                Quotes to inspire your personal mission statement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {missionQuotes.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-950/20">
                    <p className="italic text-lg mb-2">"{item.quote}"</p>
                    <p className="text-right text-sm font-medium">— {item.author}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-blue-500" />
                Example Mission Statements
              </CardTitle>
              <CardDescription>
                Examples to help you craft your own mission statement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exampleMissions.map((mission, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    <p className="text-base">{mission}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="h-5 w-5 mr-2 text-rose-500" />
                Value Categories
              </CardTitle>
              <CardDescription>
                Common value categories to help you identify your core values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {valueCategories.map((category, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      {category.icon}
                      {category.name}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {category.examples.map((value, vIndex) => (
                        <div 
                          key={vIndex} 
                          className={`rounded-full px-3 py-1 text-sm font-medium ${getValueColor(index)}`}
                        >
                          {value}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
      </Tabs>
    </div>
  )
}
