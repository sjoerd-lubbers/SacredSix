"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Target, Heart, Sparkles, ArrowRight, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import OnboardingProjectForm from "@/components/OnboardingProjectForm"

interface OnboardingStep {
  title: string
  description: string
  component: React.ReactNode
  isComplete: boolean
}

export function OnboardingFlow() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [mission, setMission] = useState("")
  const [newValue, setNewValue] = useState("")
  const [values, setValues] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasCreatedProject, setHasCreatedProject] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [projectTags, setProjectTags] = useState("")
  const projectFormRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        
        // Check if user has already completed onboarding
        if (parsedUser.mission && parsedUser.values?.length > 0) {
          setMission(parsedUser.mission)
          setValues(parsedUser.values)
        }
      } catch (error) {
        console.error("Failed to parse user data:", error)
      }
    }
  }, [])

  const saveMissionAndValues = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      // Call the API to update Sacred Six
      const response = await axios.put(
        "http://localhost:5000/api/auth/sacred-six",
        { mission, values },
        config
      )
      
      // Update local storage
      const updatedUser = { ...user, mission, values }
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setUser(updatedUser)
      
      toast({
        title: "Mission and Values saved",
        description: "Your Mission and Values have been saved successfully.",
      })
      
      return true
    } catch (error) {
      console.error("Error saving Mission and Values:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save Mission and Values. Please try again.",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const handleProjectCreated = () => {
    setHasCreatedProject(true)
  }

  const createProject = async () => {
    setIsLoading(true)
    try {
      // Validate project name
      if (!projectName.trim()) {
        toast({
          variant: "destructive",
          title: "Project name required",
          description: "Please enter a name for your project.",
        })
        return false
      }
      
      const token = localStorage.getItem("token")
      if (!token) return false
      
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }
      
      // Create project
      await axios.post(
        "http://localhost:5000/api/projects",
        {
          name: projectName,
          description: projectDescription,
          tags: projectTags
        },
        config
      )
      
      handleProjectCreated()
      
      toast({
        title: "Project created",
        description: "Your project has been created successfully.",
      })
      
      return true
    } catch (error) {
      console.error("Error creating project:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create project. Please try again.",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const handleNextStep = async () => {
    if (currentStep === 0) {
      // Validate mission
      if (!mission || mission.length < 10) {
        toast({
          variant: "destructive",
          title: "Mission required",
          description: "Please enter a mission statement (at least 10 characters).",
        })
        return
      }
      
      // Save mission and values
      const success = await saveMissionAndValues()
      if (!success) return
    } else if (currentStep === 1) {
      // Validate values
      if (!values.length) {
        toast({
          variant: "destructive",
          title: "Values required",
          description: "Please add at least one value.",
        })
        return
      }
      
      // Save mission and values
      const success = await saveMissionAndValues()
      if (!success) return
    } else if (currentStep === 2) {
      // Create project when continuing from project step
      if (!hasCreatedProject) {
        const success = await createProject()
        if (!success) return
      }
    }
    
    // Move to next step or complete onboarding
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Complete onboarding
      router.push("/dashboard")
    }
  }

  const MissionStep = (
    <div className="space-y-4">
      <div className="flex items-center">
        <Target className="h-5 w-5 mr-2 text-blue-500" />
        <h3 className="text-lg font-medium">Mission</h3>
      </div>
      <p className="text-muted-foreground">
        Your mission statement defines your purpose and what you want to achieve in life.
        It guides your decisions and helps you stay focused on what matters most.
      </p>
      <div className="space-y-2">
        <label htmlFor="mission" className="text-sm font-medium">
          Your Mission Statement
        </label>
        <Textarea
          id="mission"
          placeholder="Example: My mission is to create technology that improves people's lives while maintaining a healthy work-life balance."
          className="min-h-[100px]"
          value={mission}
          onChange={(e) => setMission(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Minimum 10 characters. Be specific about what you want to achieve and why it matters to you.
        </p>
      </div>
    </div>
  )

  const ValuesStep = (
    <div className="space-y-4">
      <div className="flex items-center">
        <Heart className="h-5 w-5 mr-2 text-red-500" />
        <h3 className="text-lg font-medium">Values</h3>
      </div>
      <p className="text-muted-foreground">
        Your core values are the principles that guide your behavior and decisions.
        They help you stay true to yourself and make choices aligned with what matters most to you.
      </p>
      <div className="space-y-2">
        <label htmlFor="values" className="text-sm font-medium">
          Your Core Values
        </label>
        <div className="flex">
          <Input
            id="values"
            placeholder="Add a value (e.g., Freedom, Growth, Creativity)"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="flex-1 mr-2"
          />
          <Button
            type="button"
            onClick={() => {
              if (newValue.trim()) {
                setValues([...values, newValue.trim()])
                setNewValue("")
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
                  setValues(values.filter((_, i) => i !== index))
                }}
                className="ml-2 text-primary hover:text-primary/80"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Add up to 10 values that are most important to you.
        </p>
      </div>
    </div>
  )

  const ProjectStep = (
    <div className="space-y-4">
      <div className="flex items-center">
        <Sparkles className="h-5 w-5 mr-2 text-yellow-500" />
        <h3 className="text-lg font-medium">Create Your First Project</h3>
      </div>
      <p className="text-muted-foreground">
        Projects help you organize your tasks and track progress toward your goals.
        Create your first project to get started with Sacred Six.
      </p>
      <div className="mt-4">
        <OnboardingProjectForm 
          onSubmit={async (data) => {
            try {
              const token = localStorage.getItem("token")
              if (!token) return
              
              const config = {
                headers: { Authorization: `Bearer ${token}` }
              }
              
              await axios.post(
                "http://localhost:5000/api/projects",
                data,
                config
              )
              
              handleProjectCreated()
              
              toast({
                title: "Project created",
                description: "Your project has been created successfully.",
              })
            } catch (error) {
              console.error("Error creating project:", error)
              toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to create project. Please try again.",
              })
            }
          }}
          isSubmitting={isLoading}
          submitLabel="Create Project"
          submittingLabel="Creating..."
          formRef={projectFormRef}
          onChange={(field, value) => {
            if (field === 'name') setProjectName(value);
            if (field === 'description') setProjectDescription(value);
            if (field === 'tags') setProjectTags(value);
          }}
        />
      </div>
      {hasCreatedProject && (
        <div className="flex items-center text-green-500 mt-2">
          <Check className="h-4 w-4 mr-1" />
          <span className="text-sm">Project created successfully!</span>
        </div>
      )}
    </div>
  )

  const CompleteStep = (
    <div className="space-y-4 text-center">
      <div className="flex justify-center">
        <div className="rounded-full bg-green-100 p-3">
          <Check className="h-8 w-8 text-green-600" />
        </div>
      </div>
      <h3 className="text-xl font-medium">Setup Complete!</h3>
      <p className="text-muted-foreground">
        You've successfully set up your Sacred Six account. You're now ready to start
        organizing your tasks and achieving your goals.
      </p>
    </div>
  )

  const steps: OnboardingStep[] = [
    {
      title: "Define Your Mission",
      description: "Set your purpose and direction",
      component: MissionStep,
      isComplete: !!mission && mission.length >= 10,
    },
    {
      title: "Define Your Values",
      description: "Identify what matters most to you",
      component: ValuesStep,
      isComplete: values.length > 0,
    },
    {
      title: "Create First Project",
      description: "Start organizing your tasks",
      component: ProjectStep,
      isComplete: hasCreatedProject,
    },
    {
      title: "Complete",
      description: "You're all set!",
      component: CompleteStep,
      isComplete: false,
    },
  ]

  return (
    <div className="p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Welcome to Sacred Six</h1>
        <p className="text-muted-foreground mt-2">
          Let's set up your account to help you achieve your goals
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-between mb-8">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                index === currentStep
                  ? "border-primary bg-primary text-primary-foreground"
                  : index < currentStep || step.isComplete
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-gray-300 bg-background text-muted-foreground"
              }`}
            >
              {index < currentStep || step.isComplete ? (
                <Check className="h-5 w-5" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <div className="text-center mt-2">
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
        </CardHeader>
        <CardContent>{steps[currentStep].component}</CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0 || isLoading}
          >
            Back
          </Button>
          <Button onClick={handleNextStep} disabled={isLoading}>
            {isLoading
              ? "Saving..."
              : currentStep === steps.length - 1
              ? "Get Started"
              : "Continue"}
            {!isLoading && currentStep < steps.length - 1 && (
              <ArrowRight className="ml-2 h-4 w-4" />
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
