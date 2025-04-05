"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ArrowUpRight, BarChart3, BookOpen, Check, Clock, Loader2, Users, UserX } from "lucide-react";

// Importing chart components
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface CourseAnalytics {
  id: string;
  title: string;
  enrollmentCount: number;
  completionRate: number;
  avgGrade: number | null;
  mostActiveDay: string;
  studentActivity: {
    day: string;
    active: number;
  }[];
  assignmentStats: {
    title: string;
    submissions: number;
    avgGrade: number | null;
  }[];
  enrollmentTrend: {
    date: string;
    count: number;
  }[];
}

interface TeacherAnalytics {
  totalStudents: number;
  totalCourses: number;
  totalAssignments: number;
  averageCompletionRate: number;
  courseAnalytics: CourseAnalytics[];
}

export default function TeacherAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<TeacherAnalytics | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<CourseAnalytics | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/analytics/teacher");
        
        if (!response.ok) {
          throw new Error("Failed to fetch analytics data");
        }
        
        const data = await response.json();
        setAnalytics(data);
        
        // Set default selected course if available
        if (data.courseAnalytics.length > 0) {
          setSelectedCourseId(data.courseAnalytics[0].id);
          setSelectedCourse(data.courseAnalytics[0]);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load analytics data",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAnalytics();
  }, [toast]);

  // Handle course selection change
  useEffect(() => {
    if (analytics && selectedCourseId) {
      const course = analytics.courseAnalytics.find(c => c.id === selectedCourseId);
      setSelectedCourse(course || null);
    }
  }, [selectedCourseId, analytics]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">No Analytics Available</h2>
        <p className="text-gray-500">
          We don't have enough data to show analytics yet. Create more courses and enroll students to see insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-500">View insights and statistics for your courses</p>
        </div>
        
        {analytics.courseAnalytics.length > 0 && (
          <div className="w-full md:w-64">
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {analytics.courseAnalytics.map(course => (
                  <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <p className="text-3xl font-bold">{analytics.totalStudents}</p>
              </div>
              <div className="rounded-full bg-blue-100 p-2.5 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Courses</p>
                <p className="text-3xl font-bold">{analytics.totalCourses}</p>
              </div>
              <div className="rounded-full bg-amber-100 p-2.5 text-amber-600">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Assignments</p>
                <p className="text-3xl font-bold">{analytics.totalAssignments}</p>
              </div>
              <div className="rounded-full bg-green-100 p-2.5 text-green-600">
                <Check className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                <p className="text-3xl font-bold">{analytics.averageCompletionRate}%</p>
              </div>
              <div className="rounded-full bg-purple-100 p-2.5 text-purple-600">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Course Specific Analytics */}
      {selectedCourse ? (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Enrollment Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Enrollment Trend</CardTitle>
                  <CardDescription>Student enrollments over time</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart 
                        data={selectedCourse.enrollmentTrend}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Student Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Student Activity</CardTitle>
                  <CardDescription>
                    Active students by day of week
                    {selectedCourse.mostActiveDay && (
                      <span className="ml-1 text-green-600">
                        (Most active: {selectedCourse.mostActiveDay})
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={selectedCourse.studentActivity}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="active" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Course Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Enrollments</span>
                      <span className="text-sm font-bold">{selectedCourse.enrollmentCount} students</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Completion Rate</span>
                      <span className="text-sm font-bold">{selectedCourse.completionRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Average Grade</span>
                      <span className="text-sm font-bold">
                        {selectedCourse.avgGrade !== null ? `${selectedCourse.avgGrade}/100` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Most Active Day</span>
                      <span className="text-sm font-bold">{selectedCourse.mostActiveDay || 'N/A'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Assignment Submission Rates</CardTitle>
                  <CardDescription>Percentage of students who submitted each assignment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={selectedCourse.assignmentStats}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis type="category" dataKey="title" width={120} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Submission Rate']} />
                        <Bar 
                          dataKey="submissions" 
                          fill="#4f46e5" 
                          radius={[0, 4, 4, 0]} 
                          label={{ position: 'right', formatter: (value: number) => `${value}%` }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="students" className="space-y-4">
            {/* Add student detailed analytics when available */}
            <Card>
              <CardHeader>
                <CardTitle>Student Engagement</CardTitle>
                <CardDescription>How students are engaging with your course</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Active', value: 60, fill: '#4f46e5' },
                          { name: 'Somewhat Active', value: 25, fill: '#8884d8' },
                          { name: 'Inactive', value: 15, fill: '#d1d5db' },
                        ]}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      />
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assignment Performance</CardTitle>
                <CardDescription>Average grades per assignment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={selectedCourse.assignmentStats.map(a => ({
                        ...a,
                        avgGrade: a.avgGrade || 0
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="title" angle={-45} textAnchor="end" height={60} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}/100`, 'Average Grade']} />
                      <Line 
                        type="monotone" 
                        dataKey="avgGrade" 
                        stroke="#4f46e5" 
                        activeDot={{ r: 8 }}
                        name="Average Grade"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <LineChart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Course Selected</h3>
          <p className="text-gray-500">
            {analytics.courseAnalytics.length > 0 
              ? "Please select a course to view detailed analytics" 
              : "Create courses and enroll students to see analytics"}
          </p>
        </div>
      )}
    </div>
  );
}
