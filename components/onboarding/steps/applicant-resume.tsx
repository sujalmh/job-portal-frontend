"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { FileUp, File, X, CheckCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import api from "@/lib/axios"
import { useAuthStore } from "@/store/authStore"

interface ApplicantResumeProps {
  data: any
  onNext: (data: any) => void
}

export default function ApplicantResume({ data, onNext }: ApplicantResumeProps) {
  // Store the actual File object in state
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const user = useAuthStore((state) => state.user)
  const { updateUser } = useAuthStore.getState();
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize from data if available
  useEffect(() => {
    if (data && data.resume) {
      setResumeFile(data.resume)
    }
  }, [data])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (isValidFile(file)) {
        setResumeFile(file)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (isValidFile(file)) {
        setResumeFile(file)
      }
    }
  }

  const handleRemoveFile = () => {
    setResumeFile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!resumeFile) {
      setError("Please upload your resume file.")
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", resumeFile)
      await api.post("/resume/upload_resume", formData, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      // Update onboarding in backend and local auth state
      const onboarding = user?.onboarding ? { ...user.onboarding, lastUpdated: new Date().toISOString(), isComplete: true } : { isComplete: true, lastUpdated: new Date().toISOString() }
      await api.put("/profile/update_profile", { onboarding }, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      updateUser({ onboarding })
      onNext({ ...data, resume: { name: resumeFile.name, size: resumeFile.size, type: resumeFile.type } })
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to upload resume.")
    } finally {
      setUploading(false)
    }
  }

  const isValidFile = (file: File) => {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/rtf",
    ]
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!validTypes.includes(file.type)) {
      alert("Invalid file type. Please upload a PDF, DOCX, or RTF file.")
      return false
    }

    if (file.size > maxSize) {
      alert("File is too large. Maximum size is 5MB.")
      return false
    }

    return true
  }

  const formatFileSize = (size: number) => {
    if (size < 1024) {
      return size + " bytes"
    } else if (size < 1024 * 1024) {
      return (size / 1024).toFixed(1) + " KB"
    } else {
      return (size / (1024 * 1024)).toFixed(1) + " MB"
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-dark-gray">Resume Upload</h2>
        <p className="text-sm text-gray-500">Upload your resume to help employers learn more about you</p>
      </div>

      {/* Upload area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center",
          dragActive
            ? "border-primary bg-primary/5"
            : resumeFile
              ? "border-gray-200 bg-light-gray"
              : "border-primary bg-light-cream",
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
            <FileUp className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-medium text-dark-gray mb-1">
            {resumeFile ? "Upload a different resume" : "Upload your resume"}
          </h3>
          <p className="text-sm text-gray-500 mb-4">Supported formats: PDF, DOCX, RTF (Max 5MB)</p>
          <label htmlFor="resume-upload">
            <Button type="button" className="bg-primary hover:bg-primary/90" onClick={() => inputRef.current?.click()}>
              Choose File
            </Button>
            <input
              id="resume-upload"
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.rtf"
              onChange={handleChange}
            />
          </label>
          <p className="text-xs text-gray-500 mt-3">or drag and drop your file here</p>
        </div>
      </div>

      {/* Uploaded file */}
      {resumeFile && (
        <div className="space-y-4">
          <h3 className="font-medium text-dark-gray">Uploaded Resume</h3>
          <div className="flex items-center justify-between border rounded-md p-3 bg-white">
            <div className="flex items-center">
              <div className="h-10 w-10 flex items-center justify-center bg-light-gray rounded-md">
                <File className="h-5 w-5 text-gray-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-dark-gray">{resumeFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(resumeFile.size)}</p>
              </div>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="text-gray-500 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-light-cream p-4 rounded-md border border-primary/20">
        <h3 className="font-medium text-dark-gray mb-2">Resume Tips</h3>
        <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
          <li>Keep your resume concise and relevant to the jobs you're applying for</li>
          <li>Use bullet points to highlight achievements and responsibilities</li>
          <li>Include keywords from job descriptions to pass through ATS systems</li>
          <li>Proofread carefully for spelling and grammar errors</li>
        </ul>
      </div>

      <div className="flex justify-end mt-6">
        <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={uploading}>
          {uploading ? "Uploading..." : "Upload & Finish"}
        </Button>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </form>
  )
}
