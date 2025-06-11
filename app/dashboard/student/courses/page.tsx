"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { BookOpen, Loader2, Search, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  createdAt: string;
  teacher: {
    name: string;
    id: string;
  };
  progress: number;
  enrolledAt: string;
  lastAccessed: string;
}

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("enrolled");
  const { toast } = useToast();

  // Move these functions outside useEffect so they can be called from handleEnroll
  const fetchEnrolledCourses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/courses/enrolled");
      
      if (!response.ok) {
        throw new Error("Failed to fetch enrolled courses");
      }
      
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your courses. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchAvailableCourses = async () => {
    if (activeTab !== "available") return;
    
    try {
      setIsLoadingAvailable(true);
      const response = await fetch("/api/courses/available");
      
      if (!response.ok) {
        throw new Error("Failed to fetch available courses");
      }
      
      const data = await response.json();
      setAvailableCourses(data);
    } catch (error) {
      console.error("Error fetching available courses:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load available courses. Please try again later.",
      });
    } finally {
      setIsLoadingAvailable(false);
    }
  };

  // Add the handleEnroll function
  const handleEnroll = async (courseId: string, e: React.MouseEvent) => {
    // Prevent the event from bubbling up to the card link
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // Show loading state
      setIsEnrolling(true);
      
      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to enroll in course");
      }
      
      // Get the enrolled course details for the success message
      const enrolledCourse = availableCourses.find(course => course.id === courseId);
      
      toast({
        title: "Success",
        description: `You've been enrolled in ${enrolledCourse?.title}`,
      });
      
      // Refresh both course lists
      await fetchEnrolledCourses();
      await fetchAvailableCourses();
      
      // Switch to enrolled tab to show the newly enrolled course
      setActiveTab("enrolled");
    } catch (error) {
      console.error("Error enrolling in course:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to enroll in course",
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  useEffect(() => {
    fetchAvailableCourses();
  }, [activeTab]);

  // Filter courses based on search
  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.teacher.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter available courses based on search
  const filteredAvailableCourses = availableCourses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.teacher.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Courses</h1>
        <p className="text-gray-500">View your enrolled courses and explore new ones</p>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search courses..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Tabs 
          defaultValue="enrolled" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="enrolled">Enrolled</TabsTrigger>
            <TabsTrigger value="available">Available</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {activeTab === "enrolled" ? (
        <>
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <div className="h-48 bg-muted">
                    <Skeleton className="h-full w-full" />
                  </div>
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              {searchQuery ? (
                <>
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Search className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No matching courses found</h3>
                  <p className="text-gray-500">Try searching with different keywords</p>
                </>
              ) : (
                <>
                  <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                    <UserPlus className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">Not enrolled in any courses yet</h3>
                  <p className="text-gray-500 mb-4">Check out available courses to get started</p>
                  <Button onClick={() => setActiveTab("available")}>Browse Available Courses</Button>
                </>
              )}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map(course => (
                <Link key={course.id} href={`/dashboard/student/courses/${course.id}`}>
                  <Card className="overflow-hidden h-full hover:shadow-md transition-shadow cursor-pointer">
                    <div className="h-48 bg-gray-200 relative overflow-hidden">
                      {course.imageUrl ? (
                        <img 
                          src={course.imageUrl} 
                          alt={course.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gradient-to-r from-blue-400 to-blue-600">
                          <BookOpen className="h-12 w-12 text-white" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
                      <p className="text-gray-500 text-sm mb-3 line-clamp-2">{course.description}</p>
                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span className="font-semibold">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-500 mt-3">
                        <span>Instructor: {course.teacher.name}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {isLoadingAvailable ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <div className="h-48 bg-muted">
                    <Skeleton className="h-full w-full" />
                  </div>
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAvailableCourses.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-1">No available courses found</h3>
              <p className="text-gray-500">
                {searchQuery ? "Try searching with different keywords" : "Check back later for new courses"}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAvailableCourses.map(course => (
                <Card key={course.id} className="overflow-hidden h-full">
                  <div className="h-48 bg-gray-200 relative overflow-hidden">
                    {course.imageUrl ? (
                      <img 
                        src={course.imageUrl} 
                        alt={course.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gradient-to-r from-gray-400 to-gray-600">
                        <BookOpen className="h-12 w-12 text-white" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{course.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Instructor: {course.teacher.name}</span>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={(e) => handleEnroll(course.id, e)}
                        disabled={isEnrolling}
                      >
                        {isEnrolling ? (
                          <span className="flex items-center">
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Enrolling...
                          </span>
                        ) : (
                          "Enroll"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}