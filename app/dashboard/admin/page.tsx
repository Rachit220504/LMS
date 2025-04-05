"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, BookOpen, GraduationCap, Loader2, Trophy, Users } from "lucide-react";

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalEnrollments: number;
  topCourses: {
    id: string;
    title: string;
    teacherName: string;
    students: number;
  }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch("/api/dashboard/admin");
        
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
          description: "Failed to load dashboard data. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDashboardData();
  }, [toast]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <p className="text-gray-500">Welcome to your admin dashboard. Monitor and manage your learning platform.</p>
      
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between space-x-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold">{stats?.totalStudents || 0}</p>
                )}
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between space-x-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Teachers</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold">{stats?.totalTeachers || 0}</p>
                )}
              </div>
              <div className="rounded-full bg-amber-100 p-3">
                <GraduationCap className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between space-x-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Courses</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold">{stats?.totalCourses || 0}</p>
                )}
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between space-x-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Enrollments</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold">{stats?.totalEnrollments || 0}</p>
                )}
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <Trophy className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Top Courses Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Top Courses</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/admin/courses" className="flex items-center">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        {isLoading ? (
          <div className="grid gap-4">
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
        ) : stats?.topCourses && stats.topCourses.length > 0 ? (
          <div className="grid gap-4">
            {stats.topCourses.map((course) => (
              <Card key={course.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{course.title}</h3>
                      <p className="text-sm text-gray-500">By {course.teacherName}</p>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-blue-600" />
                      <span>{course.students} students</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No courses available.</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Quick Links */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/dashboard/admin/courses">
            <Card className="cursor-pointer hover:bg-gray-50 transition">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-medium">Manage Courses</p>
                    <p className="text-sm text-gray-500">Add, edit or delete courses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/dashboard/admin/users">
            <Card className="cursor-pointer hover:bg-gray-50 transition">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Users className="h-6 w-6 text-amber-600" />
                  <div>
                    <p className="font-medium">Manage Users</p>
                    <p className="text-sm text-gray-500">View and manage users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/dashboard/admin/analytics">
            <Card className="cursor-pointer hover:bg-gray-50 transition">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Trophy className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium">View Analytics</p>
                    <p className="text-sm text-gray-500">Platform usage statistics</p>
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
