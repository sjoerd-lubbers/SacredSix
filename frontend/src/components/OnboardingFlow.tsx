"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { MessageSquare, Sparkles, ArrowRight, Check, Rocket, Star, MessageCircle, Target, Flag } from "lucide-react"
import { apiEndpoint } from "@/config"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
  const [isLoading, setIsLoading] = useState(false)
  const [hasCreatedProject, setHasCreatedProject] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [projectName, setProjectName] = useState("Sacred 6")
  const [projectDescription, setProjectDescription] = useState("Learn how to use Sacred 6 effectively")
  const [projectTags, setProjectTags] = useState("onboarding, tutorial")
  const projectFormRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error("Failed to parse user data:", error)
      }
    }
  }, [])

  const handleProjectCreated = () => {
    setHasCreatedProject(true)
  }

  const createProject = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return false
      
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }
      
      // Create onboarding project
      const projectResponse = await axios.post(
        apiEndpoint("projects"),
        {
          name: projectName,
          description: projectDescription,
          tags: projectTags,
          isSacred: true  // Make this a Sacred project by default
        },
        config
      )
      
      try {
        // Get the project ID from the response
        const projectId = projectResponse.data._id || projectResponse.data.id
        
        // Create goals for the project
        const goals = [
          {
            name: "Understanding Sacred 6",
            description: "This goal is a success if I understand the basic concepts of the method",
            status: "not_started"
          },
          {
            name: "Embedding Sacred 6",
            description: "This goal is a success if I'm able to use the method for other projects and know when to do repeating tasks",
            status: "not_started"
          }
        ]
        
        // Create each goal and store their IDs
        const goalIds: Record<string, string> = {}
        for (const goal of goals) {
          const goalResponse = await axios.post(
            apiEndpoint("goals"),
            {
              ...goal,
              projectId: projectId
            },
            config
          )
          goalIds[goal.name] = goalResponse.data._id || goalResponse.data.id
        }
        
        // Create tasks for the onboarding project
        const basicTasks = [
          {
            name: "Define your Mission & Values",
            description: "Go to the Mission & Values page and write your personal mission. Choose 3-5 values that guide your decisions and focus.",
            status: "todo",
            priority: "high",
            estimatedTime: 30, // 30 minutes
            goalId: goalIds["Understanding Sacred 6"]
          },
          {
            name: "Save & Validate your Mission",
            description: "Click Save to store your mission and mark it as 'This feels true for me' to activate your focus path.",
            status: "todo",
            priority: "medium",
            estimatedTime: 15, // 15 minutes
            goalId: goalIds["Understanding Sacred 6"]
          },
          {
            name: "Create your Projects",
            description: "Go to My Projects and add the most important projects you want to work on.",
            status: "todo",
            priority: "medium",
            estimatedTime: 45, // 45 minutes
            goalId: goalIds["Understanding Sacred 6"]
          },
          {
            name: "Mark your Sacred 6",
            description: "Select up to 6 projects and toggle them as Sacred. These projects define your daily focus.",
            status: "todo",
            priority: "medium",
            estimatedTime: 20, // 20 minutes
            goalId: goalIds["Understanding Sacred 6"]
          },
          {
            name: "Add Goals to your Projects",
            description: "Add clear, measurable goals to each project. Example: 'Launch website by April 15'.",
            status: "todo",
            priority: "low",
            estimatedTime: 30, // 30 minutes
            goalId: goalIds["Understanding Sacred 6"]
          }
        ]
        
        // Create basic tasks first
        const createdTasks: Record<string, string> = {}
        for (const task of basicTasks) {
          const response = await axios.post(
            apiEndpoint("tasks"),
            {
              ...task,
              projectId: projectId
            },
            config
          )
          createdTasks[task.name] = response.data._id || response.data.id
        }
        
        // Create recurring tasks separately
        const recurringTasks = [
          {
            name: "Plan your Daily Sacred 6",
            description: "Select 6 tasks from your Sacred Projects only. Keep it realistic and aligned with your mission.",
            status: "todo",
            priority: "medium",
            estimatedTime: 30, // 30 minutes
            goalId: goalIds["Embedding Sacred 6"],
            projectId: projectId
          },
          {
            name: "Daily Reflection",
            description: "Take a few minutes at the end of each day to reflect on your progress and plan for tomorrow.",
            status: "todo",
            priority: "medium",
            estimatedTime: 15, // 15 minutes
            goalId: goalIds["Embedding Sacred 6"],
            projectId: projectId
          },
          {
            name: "Weekly Reflection",
            description: "Review your week, celebrate wins, and plan for the upcoming week.",
            status: "todo",
            priority: "medium",
            estimatedTime: 30, // 30 minutes
            goalId: goalIds["Embedding Sacred 6"],
            projectId: projectId
          }
        ]
        
        // Create each recurring task and then update it with recurring options
        for (const task of recurringTasks) {
          // First create the task
          const taskResponse = await axios.post(
            apiEndpoint("tasks"),
            task,
            config
          )
          
          const taskId = taskResponse.data._id || taskResponse.data.id
          
          // Then update it with recurring options
          if (task.name === "Plan your Daily Sacred 6" || task.name === "Daily Reflection") {
            await axios.put(
              apiEndpoint(`tasks/${taskId}`),
              {
                name: task.name, // Name is required by the validation
                isRecurring: true,
                recurringDays: ["monday", "tuesday", "wednesday", "thursday", "friday"]
              },
              config
            )
          } else if (task.name === "Weekly Reflection") {
            await axios.put(
              apiEndpoint(`tasks/${taskId}`),
              {
                name: task.name, // Name is required by the validation
                isRecurring: true,
                recurringDays: ["sunday"]
              },
              config
            )
          }
        }
      } catch (taskError) {
        console.error("Error creating tasks:", taskError)
        // Continue even if task creation fails
      }
      
      handleProjectCreated()
      
      toast({
        title: "Project created",
        description: "Your Sacred 6 project has been created successfully with 8 tasks and 2 goals.",
      })
      
      return true
    } catch (error) {
      console.error("Error creating project:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create Sacred 6 project. Please try again.",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const handleNextStep = async () => {
    if (currentStep === 3) {
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

  const IntroductionStep = (
    <div className="space-y-4">
      <div className="flex items-center">
        <Rocket className="h-5 w-5 mr-2 text-blue-500" />
        <h3 className="text-lg font-medium">Welcome to Sacred 6</h3>
      </div>
      <p className="text-lg font-medium mb-4">
        You're about to start a new way of working — one that's focused, structured, and meaningful.
      </p>
      <p className="text-muted-foreground mb-4">
        With Sacred 6, you commit to what truly matters by working on six core projects and choosing six purposeful tasks each day.
      </p>
      <div className="bg-primary/10 p-4 rounded-lg">
        <h4 className="font-medium mb-2">The Sacred 6 Method:</h4>
        <ul className="list-disc pl-5 space-y-2">
          <li>Focus on 6 key projects that align with your goals</li>
          <li>Complete 6 meaningful tasks each day</li>
          <li>Eliminate distractions that don't contribute to your priorities</li>
          <li>Track your progress and reflect on your journey</li>
        </ul>
      </div>
    </div>
  )

  const TrialInfoStep = (
    <div className="space-y-4">
      <div className="flex items-center">
        <Star className="h-5 w-5 mr-2 text-yellow-500" />
        <h3 className="text-lg font-medium">Your 14-Day Trial</h3>
      </div>
      <p className="text-lg font-medium mb-4">
        Your account currently has no limitations. These will become active after 14 days.
      </p>
      <div className="bg-primary/10 p-4 rounded-lg mb-4">
        <h4 className="font-medium mb-2">✨ During your trial period, you have full access to all features, including:</h4>
        <ul className="list-disc pl-5 space-y-2">
          <li>Unlimited projects</li>
          <li>Goals for each project</li>
          <li>Daily task planning & reflections</li>
          <li>Mission & values tracking</li>
        </ul>
      </div>
      <p className="text-muted-foreground">
        After your trial, you'll need to choose between our free plan (limited to 3 sacred projects) or premium plan (unlimited projects with AI assistance).
      </p>
    </div>
  )

  const FeedbackStep = (
    <div className="space-y-4">
      <div className="flex items-center">
        <MessageCircle className="h-5 w-5 mr-2 text-green-500" />
        <h3 className="text-lg font-medium">Your Input Matters</h3>
      </div>
      <p className="text-lg font-medium mb-4">
        We're building this tool with you, and we love hearing what helps.
      </p>
      <div className="bg-primary/10 p-4 rounded-lg mb-4">
        <p className="mb-2">At the bottom of every page, you'll see a "Feedback" button.</p>
        <p className="font-medium">👉 Use it anytime to share your thoughts, ideas, or report bugs.</p>
      </div>
      <div className="flex items-center p-4 border rounded-lg">
        <MessageSquare className="h-8 w-8 mr-3 text-primary" />
        <div>
          <h4 className="font-medium">Your feedback directly shapes Sacred 6</h4>
          <p className="text-muted-foreground">We read every message and use it to improve the experience.</p>
        </div>
      </div>
    </div>
  )

  const ProjectStep = (
    <div className="space-y-4">
      <div className="flex items-center">
        <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
        <h3 className="text-lg font-medium">Your Sacred 6 Journey</h3>
      </div>
      <p className="text-muted-foreground mb-4">
        A guided project will be created to help you get started with Sacred 6. It will walk you through the essential steps to set up your productivity system.
      </p>
      
      <div className="bg-primary/10 p-4 rounded-lg mb-6">
        <h4 className="font-medium mb-3">Your "Sacred 6" project will include these steps:</h4>
        
        <div className="space-y-4">
          <div className="border-l-2 border-primary pl-4 py-1">
            <h5 className="font-medium flex items-center">
              <Target className="h-4 w-4 mr-2 text-primary" />
              1. Define your Mission & Values
            </h5>
            <ul className="text-sm text-muted-foreground mt-1 space-y-1">
              <li>📍 Go to the Mission & Values page</li>
              <li>✍️ Write your personal mission: What are you working toward?</li>
              <li>💡 Choose 3–5 values that guide your decisions and focus</li>
            </ul>
          </div>
          
          <div className="border-l-2 border-primary pl-4 py-1">
            <h5 className="font-medium flex items-center">
              <Check className="h-4 w-4 mr-2 text-primary" />
              2. Save & Validate your Mission
            </h5>
            <ul className="text-sm text-muted-foreground mt-1 space-y-1">
              <li>💾 Click Save to store your mission</li>
              <li>✅ Mark it as "This feels true for me"</li>
              <li>This activates your focus path</li>
            </ul>
          </div>
          
          <div className="border-l-2 border-primary pl-4 py-1">
            <h5 className="font-medium flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-primary" />
              3. Create your Projects
            </h5>
            <ul className="text-sm text-muted-foreground mt-1 space-y-1">
              <li>🗂️ Go to My Projects</li>
              <li>📌 Add the most important projects you want to work on</li>
            </ul>
          </div>
          
          <div className="border-l-2 border-primary pl-4 py-1">
            <h5 className="font-medium flex items-center">
              <Star className="h-4 w-4 mr-2 text-primary" />
              4. Mark your Sacred 6
            </h5>
            <ul className="text-sm text-muted-foreground mt-1 space-y-1">
              <li>🔥 Select up to 6 projects and toggle them as Sacred</li>
              <li>These projects define your daily focus</li>
            </ul>
          </div>
          
          <div className="border-l-2 border-primary pl-4 py-1">
            <h5 className="font-medium flex items-center">
              <Flag className="h-4 w-4 mr-2 text-primary" />
              5. (Optional) Add Goals to your Projects
            </h5>
            <ul className="text-sm text-muted-foreground mt-1 space-y-1">
              <li>🎯 Add clear, measurable goals to each project</li>
              <li>Example: "Launch website by April 15"</li>
            </ul>
          </div>
          
          <div className="border-l-2 border-primary pl-4 py-1">
            <h5 className="font-medium flex items-center">
              <Check className="h-4 w-4 mr-2 text-primary" />
              6. Plan your Daily Sacred 6
            </h5>
            <ul className="text-sm text-muted-foreground mt-1 space-y-1">
              <li>📝 Select 6 tasks from your Sacred Projects only</li>
              <li>⏱️ Keep it realistic and aligned with your mission</li>
              <li>🔄 <span className="text-primary font-medium">Recurring: Mon-Fri</span></li>
            </ul>
          </div>
          
          <div className="border-l-2 border-primary pl-4 py-1">
            <h5 className="font-medium flex items-center">
              <MessageCircle className="h-4 w-4 mr-2 text-primary" />
              7. Daily & Weekly Reflections
            </h5>
            <ul className="text-sm text-muted-foreground mt-1 space-y-1">
              <li>🪞 Daily Reflection (15 min, <span className="text-primary font-medium">Mon-Fri</span>)</li>
              <li>📊 Weekly Reflection (30 min, <span className="text-primary font-medium">Sunday</span>)</li>
              <li>Answer questions about your progress and plan ahead</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 border rounded-lg bg-card">
        <div className="flex items-center mb-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium">Sacred 6</h4>
            <p className="text-sm text-muted-foreground">Learn how to use Sacred 6 effectively</p>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Click "Continue" to create this project and proceed with your Sacred 6 journey.
        </p>
        
        {hasCreatedProject ? (
          <div className="flex items-center text-green-500">
            <Check className="h-4 w-4 mr-1" />
            <span className="text-sm">Sacred 6 project created successfully!</span>
          </div>
        ) : (
          <Button 
            onClick={createProject} 
            disabled={isLoading} 
            className="w-full"
          >
            {isLoading ? "Creating..." : "Create Project"}
          </Button>
        )}
      </div>
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
        You've successfully set up your Sacred 6 account. You're now ready to start
        organizing your tasks and achieving your goals.
      </p>
    </div>
  )

  const steps: OnboardingStep[] = [
    {
      title: "Introduction",
      description: "Learn about Sacred 6",
      component: IntroductionStep,
      isComplete: false,
    },
    {
      title: "Trial Info",
      description: "Your account features",
      component: TrialInfoStep,
      isComplete: false,
    },
    {
      title: "Feedback",
      description: "Help us improve",
      component: FeedbackStep,
      isComplete: false,
    },
    {
      title: "Onboarding Project",
      description: "Get started with a guide",
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
        <h1 className="text-3xl font-bold">Welcome to Sacred 6</h1>
        <p className="text-muted-foreground mt-2">
          Let's get you set up for productivity success
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
