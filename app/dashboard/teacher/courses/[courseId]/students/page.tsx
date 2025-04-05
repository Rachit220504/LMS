"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ChevronLeft, Loader2, Plus, Search, UserMinus, UserPlus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Enrollment {
  id: string;
  progress: number;
  student: Student;
  createdAt: string;
}

interface Course {
  id: string;
  title: string;
}

export default function CourseStudentsPage({ params }: { params: { courseId: string } }) {
  const courseId = params.courseId;
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removingStudentId, setRemovingStudentId] = useState("");
  
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        // Fetch course data
        const courseResponse = await fetch(`/api/courses/${courseId}`);
        if (!courseResponse.ok) {
          throw new Error("Failed to fetch course data");
        }
        const courseData = await courseResponse.json();
        setCourse(courseData);
        
        // Fetch enrollments for this course
        const enrollmentsResponse = await fetch(`/api/enrollments?courseId=${courseId}`);
        if (!enrollmentsResponse.ok) {
          throw new Error("Failed to fetch enrollments");
        }
        const enrollmentsData = await enrollmentsResponse.json();
        setEnrollments(enrollmentsData);
        
        // Fetch available students (not enrolled in this course)
        const availableResponse = await fetch(`/api/users?role=STUDENT&notInCourse=${courseId}`);
        if (!availableResponse.ok) {
          throw new Error("Failed to fetch available students");
        }
        const availableData = await availableResponse.json();
        setAvailableStudents(availableData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load student data. Please try again."
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [courseId, toast]);

  const handleAddStudent = async () => {
    if (!selectedStudentId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a student to add",
      });
      return;
    }
    
    try {
      setIsAdding(true);
      
      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: selectedStudentId,
          courseId: courseId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add student");
      }
      
      const newEnrollment = await response.json();
      
      // Refresh the student lists
      // Add the newly enrolled student to the enrollments list
      setEnrollments(prev => [...prev, newEnrollment]);
      
      // Remove the student from available students
      setAvailableStudents(prev => prev.filter(student => student.id !== selectedStudentId));
      
      toast({
        title: "Success",
        description: "Student added to course successfully",
      });
      
      setSelectedStudentId("");
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding student:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add student",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    try {
      setIsRemoving(true);
      setRemovingStudentId(studentId);
      
      // Find the enrollment for this student-course combination
      const enrollment = enrollments.find(e => e.student.id === studentId);
      
      if (!enrollment) {
        throw new Error("Enrollment not found");
      }
      
      const response = await fetch(`/api/enrollments/${enrollment.id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove student");
      }
      
      // Update the student lists
      // Remove the student from enrollments
      setEnrollments(prev => prev.filter(e => e.student.id !== studentId));
      
      // Get the student details and add to available students
      const student = enrollments.find(e => e.student.id === studentId)?.student;
      if (student) {
        setAvailableStudents(prev => [...prev, student]);
      }
      
      toast({
        title: "Success",
        description: "Student removed from course",
      });
    } catch (error) {
      console.error("Error removing student:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove student",
      });
    } finally {
      setIsRemoving(false);
      setRemovingStudentId("");
    }
  };

  // Filter enrollments by search term
  const filteredEnrollments = enrollments.filter(enrollment => 
    enrollment.student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    enrollment.student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <Link 
          href={`/dashboard/teacher/courses/${courseId}`}
          className="text-sm text-blue-600 hover:underline inline-flex items-center mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to course
        </Link>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              {course ? `${course.title} - Students` : "Course Students"}
            </h1>
            <p className="text-gray-500 mt-1">
              {enrollments.length} {enrollments.length === 1 ? "student" : "students"} enrolled
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Student to Course</DialogTitle>
                <DialogDescription>
                  Select a student to add to this course. Only students who are not already enrolled in this course will be shown.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4 space-y-4">
                {availableStudents.length > 0 ? (
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStudents.map(student => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} ({student.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-center py-2 text-gray-500">
                    No available students found. All registered students are already enrolled.
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isAdding}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddStudent} 
                  disabled={isAdding || !selectedStudentId}
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Student"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search students by name or email..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : filteredEnrollments.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Student</th>
                    <th className="py-3 px-6 text-left">Progress</th>
                    <th className="py-3 px-6 text-left">Enrolled On</th>
                    <th className="py-3 px-6 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm">
                  {filteredEnrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                            {enrollment.student.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <div className="font-medium">{enrollment.student.name}</div>
                            <div className="text-xs text-gray-500">{enrollment.student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Progress value={enrollment.progress} className="w-[100px]" />
                          <span className="text-xs font-medium">{enrollment.progress}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {new Date(enrollment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:bg-red-50 hover:text-red-700"
                              disabled={isRemoving && removingStudentId === enrollment.student.id}
                            >
                              {isRemoving && removingStudentId === enrollment.student.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <UserMinus className="h-4 w-4" />
                              )}
                              <span className="sr-only">Remove Student</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Student from Course</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove {enrollment.student.name} from this course? 
                                This will delete all their progress and submissions for this course.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveStudent(enrollment.student.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Remove Student
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {searchTerm ? "No students matching your search" : "No students enrolled"}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? "Try a different search term" : "Add students to your course to get started"}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Your First Student
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
