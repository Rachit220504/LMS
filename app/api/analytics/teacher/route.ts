import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { format, subDays, startOfDay } from "date-fns";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Get the current user
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Only teachers and admins can access analytics
    if (user.role !== "TEACHER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    // Get courses taught by the teacher
    const courses = await prisma.course.findMany({
      where: {
        teacherId: user.id,
      },
      include: {
        _count: {
          select: {
            students: true,
            assignments: true,
          },
        },
        assignments: {
          include: {
            submissions: {
              include: {
                student: true,
              },
            },
          },
        },
        students: {
          include: {
            student: true,
          },
        },
      },
    });
    
    // Calculate total students (distinct)
    const allStudentIds = new Set();
    courses.forEach((course: {
      id: string;
      title: string;
      students: { student: { id: string } }[];
      assignments: {
        title: string;
        submissions: {
          grade: number | null;
          student: any;
        }[];
      }[];
      _count: {
        students: number;
        assignments: number;
      };
    }) => {
      course.students.forEach(enrollment => {
        allStudentIds.add(enrollment.student.id);
      });
    });
    
    // Generate course-specific analytics
    const courseAnalytics = courses.map((course: {
      id: string;
      title: string;
      students: { student: { id: string } }[];
      assignments: {
        title: string;
        submissions: {
          grade: number | null;
          student: any;
        }[];
      }[];
      _count: {
        students: number;
        assignments: number;
      };
    }) => {
      // Generate dummy data for enrollment trend
      const enrollmentTrend = Array.from({ length: 10 }).map((_, i) => {
        const date = format(subDays(new Date(), i * 3), 'MMM d');
        return {
          date,
          count: Math.floor(Math.random() * 5) + (course.students.length - 10 + i),
        };
      }).reverse();
      
      // Calculate completion rate - for now, using random data
      const completionRate = Math.floor(Math.random() * 40) + 60; // 60-100%
      
      // Calculate average grade from submissions
      let totalGrade = 0;
      let gradedSubmissions = 0;
      
      course.assignments.forEach(assignment => {
        assignment.submissions.forEach(submission => {
          if (submission.grade !== null) {
            totalGrade += submission.grade;
            gradedSubmissions++;
          }
        });
      });
      
      const avgGrade = gradedSubmissions > 0 ? totalGrade / gradedSubmissions : null;
      
      // Generate student activity by day of week
      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const studentActivity = daysOfWeek.map(day => ({
        day,
        active: Math.floor(Math.random() * course.students.length),
      }));
      
      // Find most active day
      const mostActiveDay = [...studentActivity].sort((a, b) => b.active - a.active)[0]?.day;
      
      // Generate assignment stats
      const assignmentStats = course.assignments.map(assignment => {
        const submissionCount = assignment.submissions.length;
        const submissionRate = Math.round((submissionCount / course._count.students) * 100) || 0;
        
        let assignmentAvgGrade = null;
        let totalAssignmentGrade = 0;
        let gradedAssignmentSubmissions = 0;
        
        assignment.submissions.forEach(submission => {
          if (submission.grade !== null) {
            totalAssignmentGrade += submission.grade;
            gradedAssignmentSubmissions++;
          }
        });
        
        if (gradedAssignmentSubmissions > 0) {
          assignmentAvgGrade = totalAssignmentGrade / gradedAssignmentSubmissions;
        }
        
        return {
          title: assignment.title.length > 20 ? `${assignment.title.substring(0, 20)}...` : assignment.title,
          submissions: submissionRate,
          avgGrade: assignmentAvgGrade,
        };
      });
      
      return {
        id: course.id,
        title: course.title,
        enrollmentCount: course._count.students,
        completionRate,
        avgGrade,
        mostActiveDay,
        studentActivity,
        assignmentStats,
        enrollmentTrend,
      };
    });
    
    // Calculate overall analytics
    const totalStudents = allStudentIds.size;
    const totalCourses = courses.length;
    const totalAssignments = courses.reduce((sum: number, course: {
      _count: {
        assignments: number;
      }
    }) => sum + course._count.assignments, 0);
    
    // Calculate average completion rate across all courses
    const averageCompletionRate = courseAnalytics.length > 0
      ? Math.round(courseAnalytics.reduce((sum: number, course: { completionRate: number }) => sum + course.completionRate, 0) / courseAnalytics.length)
      : 0;
      
    return NextResponse.json({
      totalStudents,
      totalCourses,
      totalAssignments,
      averageCompletionRate,
      courseAnalytics,
    });
    
  } catch (error) {
    console.error("Error generating teacher analytics:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
