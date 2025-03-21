"use client"

import { useState, useEffect } from "react"
import { Target, Heart, Sparkles, PenTool, Compass, Star, Check, Clock, RefreshCw } from "lucide-react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
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
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const missionFormSchema = z.object({
  mission: z.string().min(10, {
    message: "Mission should be at least 10 characters.",
  }).max(500, {
    message: "Mission should not exceed 500 characters."
  }).optional(),
})

const valuesFormSchema = z.object({
  values: z.array(z.string()).min(1, {
    message: "Please add at least one value."
  }).max(10, {
    message: "You can add up to 10 values."
  }).optional(),
})

type MissionFormValues = z.infer<typeof missionFormSchema>
type ValuesFormValues = z.infer<typeof valuesFormSchema>

export default function ElementsTab() {
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [isSavingMission, setIsSavingMission] = useState(false)
  const [isSavingValues, setIsSavingValues] = useState(false)
  const [isValidatingMission, setIsValidatingMission] = useState(false)
  const [isValidatingValues, setIsValidatingValues] = useState(false)
  const [newValue, setNewValue] = useState("")
  const [values, setValues] = useState<string[]>([])
  const [missionLastValidated, setMissionLastValidated] = useState<string | null>(null)
  const [valuesLastValidated, setValuesLastValidated] = useState<string | null>(null)

  const missionForm = useForm<MissionFormValues>({
    resolver: zodResolver(missionFormSchema),
    defaultValues: {
      mission: "",
    },
  })

  const valuesForm = useForm<ValuesFormValues>({
    resolver: zodResolver(valuesFormSchema),
    defaultValues: {
      values: [],
    },
  })

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        
        // Initialize forms if data exists
        if (parsedUser.mission) {
          missionForm.reset({
            mission: parsedUser.mission || "",
          })
        }
        
        if (parsedUser.values) {
          valuesForm.reset({
            values: parsedUser.values || [],
          })
          setValues(parsedUser.values || [])
        }

        // Set last validated dates if they exist
        if (parsedUser.missionLastValidated) {
          setMissionLastValidated(parsedUser.missionLastValidated)
        }
        
        if (parsedUser.valuesLastValidated) {
          setValuesLastValidated(parsedUser.valuesLastValidated)
        }
      } catch (error) {
        console.error("Failed to parse user data:", error)
      }
    }
  }, [missionForm, valuesForm])

  const onMissionSubmit = async (data: MissionFormValues) => {
    setIsSavingMission(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      // Call the API to update Mission
      const response = await axios.put(
        apiEndpoint("auth/mission"),
        data,
        config
      )
      
      // Update local storage
      const updatedUser = { ...user, mission: data.mission }
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setUser(updatedUser)
      
      toast({
        title: "Mission updated",
        description: "Your mission statement has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating Mission:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update mission statement. Please try again.",
      })
    } finally {
      setIsSavingMission(false)
    }
  }

  const onValuesSubmit = async (data: ValuesFormValues) => {
    setIsSavingValues(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      // Call the API to update Values
      const response = await axios.put(
        apiEndpoint("auth/values"),
        data,
        config
      )
      
      // Update local storage
      const updatedUser = { ...user, values: data.values }
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setUser(updatedUser)
      
      toast({
        title: "Values updated",
        description: "Your core values have been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating Values:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update core values. Please try again.",
      })
    } finally {
      setIsSavingValues(false)
    }
  }

  const validateMission = async () => {
    setIsValidatingMission(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      // Call the API to validate mission
      const now = new Date().toISOString()
      const response = await axios.put(
        apiEndpoint("auth/validate-mission"),
        { missionLastValidated: now },
        config
      )
      
      // Update local storage
      const updatedUser = { ...user, missionLastValidated: now }
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setUser(updatedUser)
      setMissionLastValidated(now)
      
      toast({
        title: "Mission validated",
        description: "You've confirmed your mission statement is still valid.",
      })
    } catch (error) {
      console.error("Error validating mission:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to validate mission statement. Please try again.",
      })
    } finally {
      setIsValidatingMission(false)
    }
  }

  const validateValues = async () => {
    setIsValidatingValues(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      // Call the API to validate values
      const now = new Date().toISOString()
      const response = await axios.put(
        apiEndpoint("auth/validate-values"),
        { valuesLastValidated: now },
        config
      )
      
      // Update local storage
      const updatedUser = { ...user, valuesLastValidated: now }
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setUser(updatedUser)
      setValuesLastValidated(now)
      
      toast({
        title: "Values validated",
        description: "You've confirmed your core values are still valid.",
      })
    } catch (error) {
      console.error("Error validating values:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to validate core values. Please try again.",
      })
    } finally {
      setIsValidatingValues(false)
    }
  }

  // Function to get a random color for value badges
  const getValueColor = (index: number) => {
    const colors = [
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
      "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
    ];
    return colors[index % colors.length];
  };

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

  return (
    <div className="space-y-8">
      {/* Mission Section */}
      <Card className="border-blue-200 dark:border-blue-800/50">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-blue-500" />
                Personal Mission
              </CardTitle>
              <CardDescription className="mt-1">
                Your mission statement defines your purpose and what you want to achieve in life
              </CardDescription>
            </div>
            {missionLastValidated && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20">
                      <Clock className="h-3 w-3" />
                      <span>Validated {formatDistanceToNow(new Date(missionLastValidated))} ago</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Last validated on {format(new Date(missionLastValidated), 'PPP')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...missionForm}>
            <form onSubmit={missionForm.handleSubmit(onMissionSubmit)} className="space-y-4">
              <FormField
                control={missionForm.control}
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
              <div className="flex justify-between items-center pt-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={validateMission}
                  disabled={isValidatingMission || !user?.mission}
                  className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:border-green-800/50 dark:hover:bg-green-900/20"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {missionLastValidated ? "Revalidate Mission" : "Validate Mission"}
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSavingMission}
                >
                  {isSavingMission ? "Saving..." : "Save Mission"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        {user?.mission && (
          <CardFooter className="bg-blue-50/50 dark:bg-blue-900/10 border-t border-blue-100 dark:border-blue-800/30 flex flex-col items-start pt-4">
            <div className="text-sm text-muted-foreground mb-1">Mission Statement Tips:</div>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Keep it concise and focused on your core purpose</li>
              <li>Include what you want to achieve and how you want to achieve it</li>
              <li>Revisit and validate your mission regularly as you grow</li>
            </ul>
          </CardFooter>
        )}
      </Card>

      {/* Values Section */}
      <Card className="border-rose-200 dark:border-rose-800/50">
        <CardHeader className="bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center">
                <Heart className="h-5 w-5 mr-2 text-rose-500" />
                Core Values
              </CardTitle>
              <CardDescription className="mt-1">
                Your core values guide your decisions and define what's most important to you
              </CardDescription>
            </div>
            {valuesLastValidated && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="flex items-center gap-1 bg-rose-50 dark:bg-rose-900/20">
                      <Clock className="h-3 w-3" />
                      <span>Validated {formatDistanceToNow(new Date(valuesLastValidated))} ago</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Last validated on {format(new Date(valuesLastValidated), 'PPP')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...valuesForm}>
            <form onSubmit={valuesForm.handleSubmit(onValuesSubmit)} className="space-y-6">
              <FormField
                control={valuesForm.control}
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
                                if (updatedValues.length < 10 && !updatedValues.includes(value)) {
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
              <div className="flex justify-between items-center pt-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={validateValues}
                  disabled={isValidatingValues || values.length === 0}
                  className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:border-green-800/50 dark:hover:bg-green-900/20"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {valuesLastValidated ? "Revalidate Values" : "Validate Values"}
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSavingValues}
                >
                  {isSavingValues ? "Saving..." : "Save Values"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="bg-rose-50/50 dark:bg-rose-900/10 border-t border-rose-100 dark:border-rose-800/30 pt-4">
          <div className="w-full">
            <div className="text-sm font-medium mb-3">Value Categories for Inspiration:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {valueCategories.map((category, index) => (
                <div key={index} className="p-3 border rounded-lg bg-white dark:bg-gray-800/50">
                  <h3 className="text-sm font-medium flex items-center mb-2">
                    {category.icon}
                    {category.name}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {category.examples.map((value, vIndex) => (
                      <button
                        key={vIndex}
                        type="button"
                        onClick={() => {
                          if (values.length < 10 && !values.includes(value)) {
                            const updatedValues = [...values, value];
                            setValues(updatedValues);
                            valuesForm.setValue("values", updatedValues);
                          }
                        }}
                        disabled={values.length >= 10 || values.includes(value)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          values.includes(value)
                            ? "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
                            : `${getValueColor(index)} cursor-pointer hover:opacity-80`
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
