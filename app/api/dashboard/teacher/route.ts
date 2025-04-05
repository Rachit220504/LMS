import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

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
    
    if (user.role !== "TEACHER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    // Get all courses taught by this teacher
    const courses = await prisma.course.findMany({
      where: {
        teacherId: user.id,
      },
      include: {
        _count: {
          select: { 
            students: true,
            assignments: true
          }
        }
      }
    });
    
    // Count active courses
    const activeCourses = courses.length;
    
    // Count total students (distinct)
    const enrollments = await prisma.enrollment.findMany({
      where: {
        course: {
          teacherId: user.id
        }
      },
      select: {
        studentId: true
      }
    });
    
    const uniqueStudentIds = new Set(enrollments.map(e => e.studentId));
    const totalStudents = uniqueStudentIds.size;
    
    // Count assignments that need grading
    const submissions = await prisma.submission.findMany({
      where: {
        assignment: {
          course: {
            teacherId: user.id
          }
        },
        isGraded: false
      }
    });
    
    const assignmentsToGrade = submissions.length;
    
    // Get teaching hours (approximated - 3 hours per course per week)
    const teachingHours = activeCourses * 3;
    
    // Get recent submissions
    const recentSubmissions = await prisma.submission.findMany({
      where: {
        assignment: {
          course: {
            teacherId: user.id
          }
        }
      },
      include: {
        student: {
          select: {
            name: true
          }
        },
        assignment: {
          select: {
            title: true,
            course: {
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      },
      take: 5
    });
    
    const formattedSubmissions = recentSubmissions.map(submission => ({
      id: submission.id,
      studentName: submission.student.name,
      assignmentTitle: submission.assignment.title,
      submittedAt: submission.submittedAt.toISOString(),
      courseTitle: submission.assignment.course.title,
      isLate: submission.isLate
    }));
    
    return NextResponse.json({
      activeCourses,
      totalStudents,
      assignmentsToGrade,
      teachingHours,
      recentSubmissions: formattedSubmissions
    });
    
  } catch (error) {
    console.error("Error fetching teacher dashboard data:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
