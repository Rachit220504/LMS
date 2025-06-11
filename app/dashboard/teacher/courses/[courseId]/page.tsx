"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Calendar, PenSquare, Plus, Trash2, User, Users, UserPlus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
}

interface Enrollment {
  student: Student;
  progress: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  assignments: Assignment[];
  students: Enrollment[];
  enrollments: Enrollment[];
  _count: {
    students: number;
  }
}

export default function TeacherCourseDetailPage({ params }: { params: { courseId: string } }) {
  const courseId = params.courseId;
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [assignmentFormData, setAssignmentFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
  });
  
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function fetchCourseData() {
      try {
        // Fetch course details
        const courseResponse = await fetch(`/api/courses/${courseId}`);
        if (!courseResponse.ok) {
          throw new Error("Failed to fetch course details");
        }
        const courseData = await courseResponse.json();
        
        // Fetch students enrolled in the course
        const enrollmentsResponse = await fetch(`/api/enrollments?courseId=${courseId}`);
        if (enrollmentsResponse.ok) {
          const enrollmentsData = await enrollmentsResponse.json();
          courseData.students = enrollmentsData.students || [];
          courseData.enrollments = enrollmentsData.students || [];
        }
        
        setCourse(courseData);
      } catch (error) {
        console.error("Error fetching course data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load course. Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchCourseData();
  }, [courseId, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAssignmentFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!assignmentFormData.title || !assignmentFormData.description || !assignmentFormData.dueDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields.",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...assignmentFormData,
          courseId,
        }),
      });
      
      if (response.ok) {
        const newAssignment = await response.json();
        
        // Update the course state with the new assignment
        setCourse(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            assignments: [...prev.assignments, newAssignment],
          };
        });
        
        toast({
          title: "Success",
          description: "Assignment created successfully.",
        });
        
        setIsAssignmentDialogOpen(false);
        setAssignmentFormData({
          title: "",
          description: "",
          dueDate: "",
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || "Something went wrong");
      }
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create assignment. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      const confirmed = window.confirm("Are you sure you want to delete this assignment?");
      
      if (!confirmed) return;
      
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        // Update the course state by removing the deleted assignment
        setCourse(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            assignments: prev.assignments.filter(a => a.id !== assignmentId),
          };
        });
        
        toast({
          title: "Success",
          description: "Assignment deleted successfully.",
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || "Something went wrong");
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete assignment. Please try again.",
      });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-[60vh]">Loading course...</div>;
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-xl font-semibold mb-4">Course not found</h2>
        <Button asChild>
          <Link href="/dashboard/teacher/courses">Back to Courses</Link>
        </Button>
      </div>
    );
  }

  // Organize assignments by upcoming and past
  const now = new Date();
  const upcomingAssignments = course.assignments
    .filter(a => new Date(a.dueDate) > now)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  
  const pastAssignments = course.assignments
    .filter(a => new Date(a.dueDate) <= now)
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  return (
    <div className="space-y-6">
      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Assignment</DialogTitle>
            <DialogDescription>
              Add a new assignment for your students.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAssignment}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title"
                  name="title"
                  value={assignmentFormData.title}
                  onChange={handleInputChange}
                  placeholder="Assignment title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  name="description"
                  value={assignmentFormData.description}
                  onChange={handleInputChange}
                  placeholder="Provide details about the assignment"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input 
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={assignmentFormData.dueDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsAssignmentDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Assignment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{course.title}</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/teacher/courses/${courseId}/edit`}>
              <PenSquare className="h-4 w-4 mr-2" /> Edit Course
            </Link>
          </Button>
          <Button variant="default" size="sm" asChild>
            <Link href={`/dashboard/teacher/courses/${courseId}/students`}>
              <Users className="h-4 w-4 mr-2" />
              Manage Students
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Course Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{course.description}</p>
            </CardContent>
          </Card>

          <Tabs defaultValue="upcoming" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="upcoming">
                  Upcoming Assignments ({upcomingAssignments.length})
                </TabsTrigger>
                <TabsTrigger value="past">
                  Past Assignments ({pastAssignments.length})
                </TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="upcoming">
              {upcomingAssignments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAssignments.map((assignment) => (
                    <Card key={assignment.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{assignment.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-medium">
                              <Calendar className="h-3 w-3 mr-1" />
                              Due {new Date(assignment.dueDate).toLocaleDateString()}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteAssignment(assignment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {assignment.description}
                        </p>
                        <div className="mt-4">
                          <Button asChild size="sm">
                            <Link href={`/dashboard/teacher/courses/${courseId}/assignments/${assignment.id}`}>
                              View Assignment
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border rounded-md bg-gray-50">
                  <h3 className="font-medium text-gray-900 mb-1">No upcoming assignments</h3>
                  <p className="text-gray-500 mb-4">Create your first assignment for this course.</p>
                  <Button onClick={() => setIsAssignmentDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Create Assignment
                  </Button>
                </div>
              )}
            </TabsContent>
            <TabsContent value="past">
              {pastAssignments.length > 0 ? (
                <div className="space-y-4">
                  {pastAssignments.map((assignment) => (
                    <Card key={assignment.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{assignment.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center text-gray-500 bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                              Due date passed ({new Date(assignment.dueDate).toLocaleDateString()})
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteAssignment(assignment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {assignment.description}
                        </p>
                        <div className="mt-4">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/dashboard/teacher/courses/${courseId}/assignments/${assignment.id}`}>
                              View Submissions
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-md">
                  No past assignments for this course.
                </div>
              )}
            </TabsContent>
            <TabsContent value="students">
              <div className="mb-4 mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Enrolled Students</h3>
                  <Button asChild>
                    <Link href={`/dashboard/teacher/courses/${courseId}/students`}>
                      <Users className="h-4 w-4 mr-2" />
                      Manage Students
                    </Link>
                  </Button>
                </div>
                
                <div className="mt-4">
                  {course?.enrollments && course.enrollments.length > 0 ? (
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {course.enrollments.slice(0, 6).map(enrollment => (
                        <Card key={enrollment.student.id} className="overflow-hidden">
                          <CardContent className="p-0">
                            <div className="p-4 flex items-center gap-4">
                              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-700 font-medium text-lg">
                                  {enrollment.student.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-medium">{enrollment.student.name}</h4>
                                <p className="text-sm text-gray-500">{enrollment.student.email}</p>
                                <div className="text-xs text-gray-500 mt-1">
                                  Progress: {enrollment.progress}%
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No students enrolled</h3>
                      <p className="text-gray-500 mb-4">Add students to your course to get started</p>
                      <Button asChild>
                        <Link href={`/dashboard/teacher/courses/${courseId}/students`}>
                          Add Students
                        </Link>
                      </Button>
                    </div>
                  )}
                  
                  {course?.enrollments && course.enrollments.length > 6 && (
                    <div className="text-center mt-4">
                      <Button variant="outline" asChild>
                        <Link href={`/dashboard/teacher/courses/${courseId}/students`}>
                          View All {course.enrollments.length} Students
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Students Enrolled</CardTitle>
              <span className="text-gray-600 text-sm font-normal">{course._count.students} total</span>
            </CardHeader>
            <CardContent>
              {course.students && course.students.length > 0 ? (
                <div className="space-y-4">
                  {course.students.slice(0, 5).map((enrollment) => (
                    <div key={enrollment.student.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                          {enrollment.student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{enrollment.student.name}</p>
                          <p className="text-gray-500 text-xs">{enrollment.student.email}</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {enrollment.progress}% complete
                      </div>
                    </div>
                  ))}
                  
                  {course.students.length > 5 && (
                    <div className="pt-2 text-center">
                      <Button variant="link" className="text-sm" asChild>
                        <Link href={`/dashboard/teacher/courses/${courseId}/students`}>
                          View all students
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  No students enrolled yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Course Materials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-600">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-sm">Course Syllabus</span>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600">
                  <PenSquare className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-gray-500 text-sm mt-4">
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" /> Add Course Material
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
