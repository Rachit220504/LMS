"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Clock, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  teacher: Teacher;
  assignments: Assignment[];
  _count: {
    students: number;
  }
}

interface Enrollment {
  id: string;
  progress: number;
}

export default function CourseDetailPage({ params }: { params: { courseId: string } }) {
  const courseId = params.courseId;
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
        setCourse(courseData);

        // Fetch enrollment details (to get progress)
        const enrollmentsResponse = await fetch(`/api/enrollments`);
        if (enrollmentsResponse.ok) {
          const enrollmentsData = await enrollmentsResponse.json();
          const currentEnrollment = enrollmentsData.find(
            (e: any) => e.courseId === courseId
          );
          if (currentEnrollment) {
            setEnrollment(currentEnrollment);
          }
        }
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

  if (isLoading) {
    return <div className="flex items-center justify-center h-[60vh]">Loading course...</div>;
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-xl font-semibold mb-4">Course not found</h2>
        <Button asChild>
          <Link href="/dashboard/student/courses">Back to Courses</Link>
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
      <div className="flex items-center justify-between">
        <div>
          <Link 
            href="/dashboard/student/courses"
            className="text-sm text-blue-600 hover:underline mb-2 inline-block"
          >
            ← Back to courses
          </Link>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-gray-500">Instructor: {course.teacher.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500 flex items-center">
            <User className="h-4 w-4 mr-1" />
            <span>{course._count.students} students enrolled</span>
          </div>
          {enrollment && (
            <div className="bg-blue-50 px-4 py-2 rounded-md">
              <div className="text-xs text-blue-700 font-medium mb-1">Your Progress</div>
              <div className="flex items-center gap-2">
                <Progress value={enrollment.progress} className="w-32 h-2" />
                <span className="text-sm text-blue-700 font-medium">{enrollment.progress}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>About this course</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{course.description}</p>
            </CardContent>
          </Card>

          <Tabs defaultValue="upcoming" className="mt-6">
            <TabsList>
              <TabsTrigger value="upcoming">
                Upcoming Assignments ({upcomingAssignments.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past Assignments ({pastAssignments.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming">
              {upcomingAssignments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAssignments.map((assignment) => (
                    <Card key={assignment.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{assignment.title}</CardTitle>
                          <div className="flex items-center text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-medium">
                            <Clock className="h-3 w-3 mr-1" />
                            Due {new Date(assignment.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {assignment.description}
                        </p>
                        <div className="mt-4">
                          <Button asChild size="sm">
                            <Link href={`/dashboard/student/courses/${courseId}/assignments/${assignment.id}`}>
                              View Assignment
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-md">
                  No upcoming assignments for this course.
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
                          <div className="flex items-center text-gray-500 bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                            Due date passed ({new Date(assignment.dueDate).toLocaleDateString()})
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {assignment.description}
                        </p>
                        <div className="mt-4">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/dashboard/student/courses/${courseId}/assignments/${assignment.id}`}>
                              View Assignment
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
          </Tabs>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Instructor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-lg">
                  {course.teacher.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{course.teacher.name}</p>
                  <p className="text-sm text-gray-500">{course.teacher.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Course Materials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
                <BookOpen className="h-4 w-4" />
                <a href="#" className="text-sm">Course Syllabus</a>
              </div>
              <div className="text-gray-500 text-sm mt-4">
                Additional materials will appear here as they become available.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
