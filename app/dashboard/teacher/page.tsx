"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarRange, GraduationCap, LayoutDashboard, UserCheck, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  activeCourses: number;
  totalStudents: number;
  assignmentsToGrade: number;
  teachingHours: number;
  recentSubmissions: {
    id: string;
    studentName: string;
    assignmentTitle: string;
    submittedAt: string;
    courseTitle: string;
    isLate: boolean;
  }[];
}

export default function TeacherDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch("/api/dashboard/teacher");
        
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here's an overview of your teaching activities.</p>
      </div>
      
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Courses</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold">{stats?.activeCourses || 0}</p>
                )}
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <GraduationCap className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold">{stats?.totalStudents || 0}</p>
                )}
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Assignments to Grade</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold">{stats?.assignmentsToGrade || 0}</p>
                )}
              </div>
              <div className="rounded-full bg-amber-100 p-3">
                <LayoutDashboard className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Teaching Hours</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold">{stats?.teachingHours || 0}</p>
                )}
              </div>
              <div className="rounded-full bg-violet-100 p-3">
                <Clock className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Submissions</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats?.recentSubmissions && stats.recentSubmissions.length > 0 ? (
          <div className="space-y-3">
            {stats.recentSubmissions.map((submission) => (
              <Card key={submission.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div>
                      <p className="font-medium">{submission.studentName} submitted {submission.assignmentTitle}</p>
                      <p className="text-sm text-gray-500">Course: {submission.courseTitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarRange className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {new Date(submission.submittedAt).toLocaleString()}
                        {submission.isLate && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded">Late</span>
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <div className="flex justify-center">
              <Button variant="outline" asChild>
                <Link href="/dashboard/teacher/submissions">View All Submissions</Link>
              </Button>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No recent submissions to display.</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Link href="/dashboard/teacher/courses">
            <Card className="cursor-pointer hover:bg-gray-50 transition">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <GraduationCap className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-medium">Manage Courses</p>
                    <p className="text-sm text-gray-500">View and edit your courses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/dashboard/teacher/analytics">
            <Card className="cursor-pointer hover:bg-gray-50 transition">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <LayoutDashboard className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium">View Analytics</p>
                    <p className="text-sm text-gray-500">Track student performance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/dashboard/profile">
            <Card className="cursor-pointer hover:bg-gray-50 transition">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <UserCheck className="h-6 w-6 text-violet-600" />
                  <div>
                    <p className="font-medium">Update Profile</p>
                    <p className="text-sm text-gray-500">Manage your account</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
