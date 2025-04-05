"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ArrowDownToLine, ArrowUpRight, BookOpen, Calendar, GraduationCap, Loader2, MoreHorizontal, TrendingUp, UserCheck, UserPlus, Users } from "lucide-react";

// Importing chart components
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Sector, Tooltip, XAxis, YAxis } from "recharts";

interface PlatformAnalytics {
  usersCount: {
    total: number;
    students: number;
    teachers: number;
    admins: number;
  };
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  coursesCount: {
    total: number;
    published: number;
    draft: number;
  };
  enrollmentsCount: number;
  completionRate: number;
  userGrowth: {
    date: string;
    students: number;
    teachers: number;
  }[];
  courseGrowth: {
    date: string;
    count: number;
  }[];
  enrollmentGrowth: {
    date: string;
    count: number;
  }[];
  topCourses: {
    id: string;
    title: string;
    teacherName: string;
    students: number;
    completionRate: number;
  }[];
  topTeachers: {
    id: string;
    name: string;
    coursesCount: number;
    studentsCount: number;
    avgRating: number;
  }[];
  userRoleDistribution: {
    name: string;
    value: number;
  }[];
}

export default function AdminAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [timeRange, setTimeRange] = useState<string>("30days");
  const { toast } = useToast();

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/analytics/admin?timeRange=${timeRange}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch analytics data");
        }
        
        const data = await response.json();
        setAnalytics(data);
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
  }, [timeRange, toast]);

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
          We don't have enough data to show platform analytics yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Platform Analytics</h1>
          <p className="text-gray-500">View insights and statistics across the entire platform</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <ArrowDownToLine className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold">{analytics.usersCount.total}</p>
                  <span className="text-xs text-green-600 font-medium flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    12%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">vs. previous period</p>
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
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold">{analytics.coursesCount.total}</p>
                  <span className="text-xs text-green-600 font-medium flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    8%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">vs. previous period</p>
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
                <p className="text-sm font-medium text-gray-500">Enrollments</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold">{analytics.enrollmentsCount}</p>
                  <span className="text-xs text-green-600 font-medium flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    15%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">vs. previous period</p>
              </div>
              <div className="rounded-full bg-green-100 p-2.5 text-green-600">
                <UserCheck className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold">{analytics.completionRate}%</p>
                  <span className="text-xs text-amber-600 font-medium flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    2%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">vs. previous period</p>
              </div>
              <div className="rounded-full bg-purple-100 p-2.5 text-purple-600">
                <GraduationCap className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New user registrations over time</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={analytics.userGrowth}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="students" 
                        stackId="1"
                        stroke="#4f46e5" 
                        fill="#4f46e5" 
                        name="Students"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="teachers" 
                        stackId="1"
                        stroke="#06b6d4" 
                        fill="#06b6d4" 
                        name="Teachers"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Enrollment Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Enrollment Trend</CardTitle>
                <CardDescription>Course enrollments over time</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={analytics.enrollmentGrowth}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#10b981" 
                        activeDot={{ r: 8 }}
                        name="Enrollments"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* User Role Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>User Role Distribution</CardTitle>
              <CardDescription>Breakdown of users by role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.userRoleDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {analytics.userRoleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#4f46e5', '#06b6d4', '#10b981'][index % 3]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} users`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Top Courses Table */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Top Courses</CardTitle>
              <CardDescription>Courses with the highest enrollment</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="pb-3 px-6 pt-6 font-medium text-gray-500">Course Title</th>
                      <th className="pb-3 px-6 pt-6 font-medium text-gray-500">Teacher</th>
                      <th className="pb-3 px-6 pt-6 font-medium text-gray-500">Students</th>
                      <th className="pb-3 px-6 pt-6 font-medium text-gray-500">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topCourses.map((course, index) => (
                      <tr key={course.id} className="border-b last:border-0">
                        <td className="py-3 px-6">
                          <div className="font-medium">{course.title}</div>
                        </td>
                        <td className="py-3 px-6 text-gray-500">
                          {course.teacherName}
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1 text-blue-600" />
                            {course.students}
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-2">
                            <div className="bg-gray-200 w-24 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-green-500 h-full rounded-full" 
                                style={{ width: `${course.completionRate}%` }} 
                              />
                            </div>
                            <span className="text-xs">{course.completionRate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>Active users across different time periods</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col items-center p-4 rounded-lg bg-blue-50">
                    <Calendar className="h-8 w-8 text-blue-600 mb-2" />
                    <p className="text-lg font-bold">{analytics.activeUsers.daily}</p>
                    <p className="text-sm text-gray-500">Daily Active Users</p>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-purple-50">
                    <Calendar className="h-8 w-8 text-purple-600 mb-2" />
                    <p className="text-lg font-bold">{analytics.activeUsers.weekly}</p>
                    <p className="text-sm text-gray-500">Weekly Active Users</p>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-green-50">
                    <Calendar className="h-8 w-8 text-green-600 mb-2" />
                    <p className="text-lg font-bold">{analytics.activeUsers.monthly}</p>
                    <p className="text-sm text-gray-500">Monthly Active Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Top Teachers */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Top Teachers</CardTitle>
                <CardDescription>Teachers with the most students enrolled in their courses</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-3 px-6 pt-6 font-medium text-gray-500">Teacher Name</th>
                        <th className="pb-3 px-6 pt-6 font-medium text-gray-500">Courses</th>
                        <th className="pb-3 px-6 pt-6 font-medium text-gray-500">Students</th>
                        <th className="pb-3 px-6 pt-6 font-medium text-gray-500">Avg. Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.topTeachers.map((teacher) => (
                        <tr key={teacher.id} className="border-b last:border-0">
                          <td className="py-3 px-6">
                            <div className="font-medium">{teacher.name}</div>
                          </td>
                          <td className="py-3 px-6">
                            <div className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-1 text-amber-600" />
                              {teacher.coursesCount}
                            </div>
                          </td>
                          <td className="py-3 px-6">
                            <div className="flex items-center">
                              <UserCheck className="h-4 w-4 mr-1 text-blue-600" />
                              {teacher.studentsCount}
                            </div>
                          </td>
                          <td className="py-3 px-6">
                            <div className="flex items-center">
                              {Array(5).fill(0).map((_, i) => (
                                <svg 
                                  key={i}
                                  className={`h-4 w-4 ${i < Math.round(teacher.avgRating) ? 'text-yellow-400' : 'text-gray-300'}`} 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  viewBox="0 0 24 24" 
                                  fill="currentColor"
                                >
                                  <path 
                                    fillRule="evenodd" 
                                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" 
                                    clipRule="evenodd" 
                                  />
                                </svg>
                              ))}
                              <span className="ml-1 text-sm">{teacher.avgRating.toFixed(1)}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="courses">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Course Growth</CardTitle>
                <CardDescription>New courses created over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={analytics.courseGrowth}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#f59e0b" 
                        fill="#fde68a" 
                        name="Courses"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Course Status</CardTitle>
                  <CardDescription>Distribution of course status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Published', value: analytics.coursesCount.published, fill: '#22c55e' },
                            { name: 'Draft', value: analytics.coursesCount.draft, fill: '#94a3b8' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                        </Pie>
                        <Tooltip 
                          formatter={(value, name) => [`${value} courses`, name]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                  <CardTitle>Enrollments by Month</CardTitle>
                  <CardDescription>Monthly enrollment statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { month: 'Jan', enrollments: 65 },
                          { month: 'Feb', enrollments: 85 },
                          { month: 'Mar', enrollments: 110 },
                          { month: 'Apr', enrollments: 95 },
                          { month: 'May', enrollments: 120 },
                          { month: 'Jun', enrollments: 160 },
                          { month: 'Jul', enrollments: 140 },
                          { month: 'Aug', enrollments: 170 },
                          { month: 'Sep', enrollments: 195 },
                          { month: 'Oct', enrollments: 205 },
                          { month: 'Nov', enrollments: 245 },
                          { month: 'Dec', enrollments: 210 },
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="enrollments" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="engagement">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Engagement Metrics</CardTitle>
                <CardDescription>Key engagement statistics across all users and courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="border rounded-lg p-4">
                    <p className="text-gray-500 text-sm mb-1">Average Session Duration</p>
                    <p className="text-2xl font-bold">18.2 min</p>
                    <div className="flex items-center mt-2 text-sm text-green-600">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      <span>+5.3% vs. last period</span>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <p className="text-gray-500 text-sm mb-1">Assignment Completion</p>
                    <p className="text-2xl font-bold">68.4%</p>
                    <div className="flex items-center mt-2 text-sm text-amber-600">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      <span>+1.2% vs. last period</span>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <p className="text-gray-500 text-sm mb-1">Avg. Course Completion</p>
                    <p className="text-2xl font-bold">{analytics.completionRate}%</p>
                    <div className="flex items-center mt-2 text-sm text-green-600">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      <span>+2.8% vs. last period</span>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <p className="text-gray-500 text-sm mb-1">Active Students</p>
                    <p className="text-2xl font-bold">{analytics.activeUsers.weekly}</p>
                    <div className="flex items-center mt-2 text-sm text-green-600">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      <span>+11.6% vs. last period</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-medium mb-4">Engagement Over Time</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { date: 'Week 1', sessions: 25, assignments: 18, materials: 42 },
                          { date: 'Week 2', sessions: 33, assignments: 24, materials: 55 },
                          { date: 'Week 3', sessions: 40, assignments: 29, materials: 58 },
                          { date: 'Week 4', sessions: 35, assignments: 25, materials: 62 },
                          { date: 'Week 5', sessions: 45, assignments: 32, materials: 71 },
                          { date: 'Week 6', sessions: 50, assignments: 35, materials: 68 },
                          { date: 'Week 7', sessions: 42, assignments: 31, materials: 64 },
                          { date: 'Week 8', sessions: 48, assignments: 38, materials: 75 },
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="sessions" stroke="#8884d8" activeDot={{ r: 8 }} name="User Sessions" />
                        <Line type="monotone" dataKey="assignments" stroke="#82ca9d" name="Assignment Submissions" />
                        <Line type="monotone" dataKey="materials" stroke="#ffc658" name="Materials Viewed" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
