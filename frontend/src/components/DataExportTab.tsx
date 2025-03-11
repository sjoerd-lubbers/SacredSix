"use client"

import { useState } from "react"
import axios from "axios"
import { Download, Upload, FileJson, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function DataExportTab() {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importStats, setImportStats] = useState<any>(null)
  const [importError, setImportError] = useState<string | null>(null)
  
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "You must be logged in to export data.",
        })
        return
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      const response = await axios.get("http://localhost:5000/api/data-export", config)
      
      // Convert the data to a JSON string
      const jsonData = JSON.stringify(response.data, null, 2)
      
      // Create a blob from the JSON string
      const blob = new Blob([jsonData], { type: 'application/json' })
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob)
      
      // Create a temporary link element
      const link = document.createElement('a')
      link.href = url
      
      // Set the filename
      const date = new Date().toISOString().split('T')[0]
      link.download = `sacred-six-export-${date}.json`
      
      // Append the link to the body
      document.body.appendChild(link)
      
      // Click the link to trigger the download
      link.click()
      
      // Clean up
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Export Successful",
        description: "Your data has been exported successfully.",
      })
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "There was an error exporting your data. Please try again.",
      })
    } finally {
      setIsExporting(false)
    }
  }
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      setImportFile(files[0])
      setImportError(null)
      setImportStats(null)
    }
  }
  
  const validateImportFile = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const data = JSON.parse(content)
          
          // Basic validation
          if (!data.version || !data.projects || !data.tasks) {
            setImportError("Invalid file format. The file does not contain the required data.")
            resolve(false)
            return
          }
          
          resolve(true)
        } catch (error) {
          setImportError("Invalid JSON file. Please select a valid export file.")
          resolve(false)
        }
      }
      
      reader.onerror = () => {
        setImportError("Error reading file. Please try again.")
        resolve(false)
      }
      
      reader.readAsText(file)
    })
  }
  
  const handleImport = async () => {
    if (!importFile) {
      toast({
        variant: "destructive",
        title: "No File Selected",
        description: "Please select a file to import.",
      })
      return
    }
    
    setIsImporting(true)
    setImportError(null)
    
    try {
      // Validate the file first
      const isValid = await validateImportFile(importFile)
      if (!isValid) {
        setIsImporting(false)
        return
      }
      
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "You must be logged in to import data.",
        })
        return
      }

      const config = {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
      
      // Read the file content
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string
          const data = JSON.parse(content)
          
          // Send the data to the server
          const response = await axios.post(
            "http://localhost:5000/api/data-export/import", 
            data, 
            config
          )
          
          setImportStats(response.data.stats)
          
          toast({
            title: "Import Successful",
            description: "Your data has been imported successfully.",
          })
          
          // Reset the file input
          setImportFile(null)
          const fileInput = document.getElementById('import-file') as HTMLInputElement
          if (fileInput) {
            fileInput.value = ''
          }
        } catch (error: any) {
          console.error("Error importing data:", error)
          setImportError(error.response?.data?.message || "There was an error importing your data. Please try again.")
          
          toast({
            variant: "destructive",
            title: "Import Failed",
            description: "There was an error importing your data. Please check the error message for details.",
          })
        } finally {
          setIsImporting(false)
        }
      }
      
      reader.onerror = () => {
        setImportError("Error reading file. Please try again.")
        setIsImporting(false)
      }
      
      reader.readAsText(importFile)
    } catch (error) {
      console.error("Error importing data:", error)
      setImportError("There was an error importing your data. Please try again.")
      setIsImporting(false)
      
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: "There was an error importing your data. Please try again.",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>
            Export all your Sacred Six data to a JSON file. This includes your projects, tasks, reflections, and settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            The exported file will contain all your data in a format that can be imported back into Sacred Six.
            Use this feature to create backups or transfer your data to another account.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleExport} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export Data"}
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog>
        <Card>
          <CardHeader>
            <CardTitle>Import Data</CardTitle>
            <CardDescription>
              Import your Sacred Six data from a previously exported JSON file.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              <strong>Warning:</strong> Importing data will replace all your existing data. 
              Make sure to export your current data first if you want to keep it.
            </p>
            
            <div className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <label htmlFor="import-file" className="text-sm font-medium">
                  Select File
                </label>
                <input
                  id="import-file"
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              
              {importFile && (
                <div className="flex items-center space-x-2 text-sm">
                  <FileJson className="h-4 w-4 text-blue-500" />
                  <span>{importFile.name}</span>
                </div>
              )}
              
              {importError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{importError}</AlertDescription>
                </Alert>
              )}
              
              {importStats && (
                <Alert>
                  <AlertTitle>Import Successful</AlertTitle>
                  <AlertDescription>
                    <p>The following data was imported:</p>
                    <ul className="list-disc list-inside mt-2">
                      <li>{importStats.projects} projects</li>
                      <li>{importStats.tasks} tasks</li>
                      {importStats.reflections > 0 && (
                        <li>{importStats.reflections} reflections</li>
                      )}
                      {importStats.dailyCompletions > 0 && (
                        <li>{importStats.dailyCompletions} daily completions</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <AlertDialogTrigger asChild>
              <Button variant="default" disabled={!importFile || isImporting}>
                <Upload className="mr-2 h-4 w-4" />
                {isImporting ? "Importing..." : "Import Data"}
              </Button>
            </AlertDialogTrigger>
          </CardFooter>
          
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will replace all your existing data with the data from the imported file.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleImport}>
                Yes, Import Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </Card>
      </AlertDialog>
    </div>
  )
}
