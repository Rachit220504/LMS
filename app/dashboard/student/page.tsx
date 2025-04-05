"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Clock, GraduationCap, Layers, ScrollText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface DashboardStats {
  enrolledCourses: number;
  averageProgress: number;
  completedCourses: number;
  upcomingAssignments: {
    id: string;
    title: string;
    courseId: string;
    courseTitle: string;
    dueDate: string;
  }[];
  recentSubmissions: {
    id: string;
    assignmentId: string;
    assignmentTitle: string;
    courseId: string;
    courseTitle: string;
    grade: number;
    submittedAt: string;
    gradedAt: string;
  }[];
}

export default function StudentDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/dashboard/student");
        
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }
        
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load dashboard data. Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDashboardData();
  }, [toast]);

  function formatDueDate(dateString: string) {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here's an overview of your learning journey.</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Enrolled Courses</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold">{stats?.enrolledCourses || 0}</p>
                )}
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <BookOpen className="text-blue-600 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Average Progress</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold">{stats?.averageProgress || 0}%</p>
                )}
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Layers className="text-green-600 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Completed Courses</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold">{stats?.completedCourses || 0}</p>
                )}
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <GraduationCap className="text-purple-600 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* My Courses Link Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">My Courses</h2>
            <Button asChild variant="outline">
              <Link href="/dashboard/student/courses">View All Courses</Link>
            </Button>
          </div>
          <p className="text-gray-500">
            {isLoading ? "Loading courses..." : 
              `You are enrolled in ${stats?.enrolledCourses || 0} courses. Continue learning where you left off.`}
          </p>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Assignments Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Assignments</CardTitle>
            <CardDescription>Assignments due soon</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between">
                    <div>
                      <Skeleton className="h-5 w-48 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : stats?.upcomingAssignments && stats.upcomingAssignments.length > 0 ? (
              <div className="space-y-4">
                {stats.upcomingAssignments.map(assignment => (
                  <div key={assignment.id} className="flex justify-between items-center">
                    <div>
                      <Link 
                        href={`/dashboard/student/courses/${assignment.courseId}/assignments/${assignment.id}`}
                        className="font-medium hover:text-blue-600 hover:underline"
                      >
                        {assignment.title}
                      </Link>
                      <p className="text-sm text-gray-500">{assignment.courseTitle}</p>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-amber-500 mr-1" />
                      <span className="text-sm text-amber-600">
                        Due {formatDueDate(assignment.dueDate)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ScrollText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming assignments</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Recent Grades Section */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Grades</CardTitle>
            <CardDescription>Your latest assignment results</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between">
                    <div>
                      <Skeleton className="h-5 w-48 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </div>
            ) : stats?.recentSubmissions && stats.recentSubmissions.length > 0 ? (
              <div className="space-y-4">
                {stats.recentSubmissions.map(submission => (
                  <div key={submission.id} className="flex justify-between items-center">
                    <div>
                      <Link 
                        href={`/dashboard/student/courses/${submission.courseId}/assignments/${submission.assignmentId}`}
                        className="font-medium hover:text-blue-600 hover:underline"
                      >
                        {submission.assignmentTitle}
                      </Link>
                      <p className="text-sm text-gray-500">{submission.courseTitle}</p>
                    </div>
                    <div className={`text-lg font-bold ${
                      submission.grade >= 80 ? "text-green-600" :
                      submission.grade >= 60 ? "text-amber-600" : "text-red-600"
                    }`}>
                      {submission.grade}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ScrollText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No grades yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
