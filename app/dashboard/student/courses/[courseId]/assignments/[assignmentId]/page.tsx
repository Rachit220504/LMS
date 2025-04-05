"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CalendarClock, ChevronLeft, Clock, Download, Upload, FileIcon, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  courseId: string;
  course: {
    title: string;
    teacher: {
      name: string;
    };
  };
  submissions: {
    id: string;
    name: string;
  }[];
}

interface SubmissionFile {
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export default function AssignmentDetailPage({ params }: { params: { courseId: string; assignmentId: string } }) {
  const { courseId, assignmentId } = params;
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<SubmissionFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function fetchAssignmentData() {
      try {
        const response = await fetch(`/api/assignments/${assignmentId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch assignment details");
        }

        const data = await response.json();
        setAssignment(data);

        setIsSubmitted(data.submissions.length > 0);
      } catch (error) {
        console.error("Error fetching assignment data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load assignment. Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchAssignmentData();
  }, [assignmentId, toast]);

  const handleSubmissionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSubmission(e.target.value);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "File size exceeds 10MB limit.",
      });
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "submission");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "File upload failed");
      }

      const fileData = await response.json();
      setUploadedFile(fileData);

      toast({
        title: "Success",
        description: "File uploaded successfully.",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!submission.trim() && !uploadedFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter text or upload a file for your submission.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const submissionData = {
        assignmentId,
        content: submission,
        ...(uploadedFile && {
          fileUrl: uploadedFile.fileUrl,
          fileName: uploadedFile.fileName,
          fileType: uploadedFile.fileType,
          fileSize: uploadedFile.fileSize,
        }),
      };

      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit assignment");
      }

      toast({
        title: "Success",
        description: "Assignment submitted successfully.",
      });

      setIsSubmitted(true);

      const refreshResponse = await fetch(`/api/assignments/${assignmentId}`);
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setAssignment(refreshData);
      }
    } catch (error) {
      console.error("Error submitting assignment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit assignment. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-[60vh]">Loading assignment...</div>;
  }

  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-xl font-semibold mb-4">Assignment not found</h2>
        <Button asChild>
          <Link href={`/dashboard/student/courses/${courseId}`}>Back to Course</Link>
        </Button>
      </div>
    );
  }

  const dueDate = new Date(assignment.dueDate);
  const isPastDue = dueDate < new Date();
  const timeLeft = formatDistanceToNow(dueDate, { addSuffix: true });

  return (
    <div className="space-y-6">
      <div>
        <Link 
          href={`/dashboard/student/courses/${courseId}`}
          className="text-sm text-blue-600 hover:underline inline-flex items-center mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to {assignment.course.title}
        </Link>
        
        <h1 className="text-3xl font-bold">{assignment.title}</h1>
        <div className="flex items-center text-gray-500 mt-1">
          <CalendarClock className="h-4 w-4 mr-1" />
          <span className="mr-2">Due {new Date(assignment.dueDate).toLocaleString()}</span>
          {isPastDue ? (
            <span className="text-red-500 font-medium">Overdue</span>
          ) : (
            <span className="text-amber-600 font-medium">{timeLeft}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Instructions</CardTitle>
              <CardDescription>
                Posted by {assignment.course.teacher.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-blue max-w-none">
                <div className="whitespace-pre-line">{assignment.description}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="order-first lg:order-none lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Submission Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Status:</span>
                  <span className={`font-medium ${isSubmitted ? "text-green-600" : "text-amber-600"}`}>
                    {isSubmitted ? "Submitted" : "Not Submitted"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Time Left:</span>
                  <span className={isPastDue ? "text-red-500" : ""}>
                    {isPastDue ? "Past Due" : timeLeft}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Due Date:</span>
                  <span>{new Date(assignment.dueDate).toLocaleDateString()}</span>
                </div>
                {isSubmitted && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Submitted On:</span>
                      <span>{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Grade:</span>
                      <span>Not graded</span>
                    </div>
                  </>
                )}
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-2">Course Information</h4>
                  <p className="text-sm">{assignment.course.title}</p>
                  <p className="text-sm text-gray-500">Instructor: {assignment.course.teacher.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
