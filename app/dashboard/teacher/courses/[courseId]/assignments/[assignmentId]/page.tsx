"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Clock, Download, Edit, FileText, Loader2, Save, Trash, UserCheck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Student {
  id: string;
  name: string;
  email: string;
}

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
    _count?: {
      students: number;
    };
  };
  submissions: Student[];
}

export default function TeacherAssignmentPage({ params }: { params: { courseId: string; assignmentId: string } }) {
  const { courseId, assignmentId } = params;
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
  });
  
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
        
        // Format the date for the datetime-local input
        const isoDate = new Date(data.dueDate).toISOString().slice(0, 16);
        
        setFormData({
          title: data.title,
          description: data.description,
          dueDate: isoDate,
        });
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update assignment");
      }
      
      const updatedAssignment = await response.json();
      setAssignment(updatedAssignment);
      
      toast({
        title: "Success",
        description: "Assignment updated successfully.",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update assignment. Please try again later.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete assignment");
      }
      
      toast({
        title: "Success",
        description: "Assignment deleted successfully.",
      });
      
      router.push(`/dashboard/teacher/courses/${courseId}`);
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete assignment. Please try again later.",
      });
    } finally {
      setIsDeleting(false);
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
          <Link href={`/dashboard/teacher/courses/${courseId}`}>Back to Course</Link>
        </Button>
      </div>
    );
  }

  const isPastDue = new Date(assignment.dueDate) < new Date();
  const submissionCount = assignment.submissions.length;

  return (
    <div className="space-y-6">
      <div>
        <Link 
          href={`/dashboard/teacher/courses/${courseId}`}
          className="text-sm text-blue-600 hover:underline inline-flex items-center mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to {assignment.course.title}
        </Link>
        
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold">{assignment.title}</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(!isEditing)}
              disabled={isSaving}
            >
              {isEditing ? (
                <>Cancel</>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting || isSaving}>
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this assignment and all associated student submissions.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <div className="flex items-center text-gray-500 mt-1">
          <Clock className="h-4 w-4 mr-1" />
          <span>Due {new Date(assignment.dueDate).toLocaleString()}</span>
          <span className="mx-2">•</span>
          <span className={isPastDue ? "text-red-500" : "text-green-500"}>
            {isPastDue ? "Past Due" : "Active"}
          </span>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Assignment Details</TabsTrigger>
          <TabsTrigger value="submissions">
            Submissions ({submissionCount})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="pt-4">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Assignment Details</CardTitle>
                  <CardDescription>
                    {isEditing 
                      ? "Edit the assignment details below" 
                      : "Review the assignment instructions and requirements"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Assignment Title</Label>
                        <Input
                          id="title"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="Enter assignment title"
                          disabled={isSaving}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">Instructions</Label>
                        <Textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Enter assignment instructions"
                          rows={10}
                          disabled={isSaving}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                          id="dueDate"
                          name="dueDate"
                          type="datetime-local"
                          value={formData.dueDate}
                          onChange={handleInputChange}
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-blue max-w-none">
                      <div className="whitespace-pre-line">{assignment.description}</div>
                    </div>
                  )}
                </CardContent>
                {isEditing && (
                  <CardFooter>
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Assignment Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Status:</span>
                      <span className={`font-medium ${isPastDue ? "text-red-500" : "text-green-500"}`}>
                        {isPastDue ? "Past Due" : "Active"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Due Date:</span>
                      <span>{new Date(assignment.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Submissions:</span>
                      <span>{submissionCount} student{submissionCount !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Completion Rate:</span>
                      <span>
                        {(assignment.course._count?.students ?? 0) > 0 
                          ? `${Math.round((submissionCount / (assignment.course._count?.students ?? 1)) * 100)}%`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium mb-2">Course Information</h4>
                      <p className="text-sm">{assignment.course.title}</p>
                      <p className="text-sm text-gray-500">Instructor: {assignment.course.teacher.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Assignment Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Download Instructions
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Export Submission Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="submissions" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Submissions</CardTitle>
              <CardDescription>
                {submissionCount > 0 
                  ? `${submissionCount} students have submitted this assignment` 
                  : "No submissions yet for this assignment"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submissionCount > 0 ? (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submission Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Grade
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {assignment.submissions.map((student) => (
                        <tr key={student.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                {student.name.charAt(0)}
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{student.name}</p>
                                <p className="text-sm text-gray-500">{student.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Nov 15, 2023
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              On time
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Not graded
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button size="sm">
                              Grade
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-md">
                  <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No submissions yet</h3>
                  <p className="text-gray-500 mb-4">Students haven't submitted their work for this assignment yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
