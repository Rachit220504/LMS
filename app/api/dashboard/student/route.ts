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
    
    if (user.role !== "STUDENT" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    // Get enrollments for this student
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: user.id,
      },
      include: {
        course: {
          include: {
            teacher: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    
    // Count enrolled courses
    const enrolledCourses = enrollments.length;
    
    // Calculate average progress across all courses
    const totalProgress = enrollments.reduce((sum, enrollment) => sum + enrollment.progress, 0);
    const averageProgress = enrolledCourses > 0 
      ? Math.round(totalProgress / enrolledCourses) 
      : 0;
    
    // Count completed courses
    const completedCourses = enrollments.filter(enrollment => enrollment.progress === 100).length;
    
    // Get upcoming assignments
    const now = new Date();
    const upcomingAssignments = await prisma.assignment.findMany({
      where: {
        course: {
          students: {
            some: {
              studentId: user.id,
            },
          },
        },
        dueDate: {
          gte: now,
        },
        NOT: {
          submissions: {
            some: {
              studentId: user.id,
            },
          },
        },
      },
      include: {
        course: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
      take: 5,
    });
    
    // Format upcoming assignments
    const formattedAssignments = upcomingAssignments.map(assignment => ({
      id: assignment.id,
      title: assignment.title,
      courseId: assignment.courseId,
      courseTitle: assignment.course.title,
      dueDate: assignment.dueDate.toISOString(),
    }));
    
    // Get recent grades/submissions
    const recentSubmissions = await prisma.submission.findMany({
      where: {
        studentId: user.id,
        isGraded: true,
      },
      include: {
        assignment: {
          select: {
            title: true,
            courseId: true,
            course: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        gradedAt: "desc",
      },
      take: 5,
    });
    
    // Format recent submissions
    const formattedSubmissions = recentSubmissions.map(submission => ({
      id: submission.id,
      assignmentId: submission.assignmentId,
      assignmentTitle: submission.assignment.title,
      courseId: submission.assignment.courseId,
      courseTitle: submission.assignment.course.title,
      grade: submission.grade,
      submittedAt: submission.submittedAt.toISOString(),
      gradedAt: submission.gradedAt?.toISOString(),
    }));
    
    return NextResponse.json({
      enrolledCourses,
      averageProgress,
      completedCourses,
      upcomingAssignments: formattedAssignments,
      recentSubmissions: formattedSubmissions,
    });
    
  } catch (error) {
    console.error("Error fetching student dashboard data:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
