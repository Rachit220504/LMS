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
    
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get("assignmentId");
    const studentId = searchParams.get("studentId");
    
    if (!assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      );
    }
    
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
    
    // Check if the user has access to the assignment
    const assignment = await prisma.assignment.findUnique({
      where: {
        id: assignmentId,
      },
      include: {
        course: true,
      },
    });
    
    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }
    
    // Teachers can see all submissions for their courses
    if (user.role === "TEACHER" && assignment.course.teacherId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    // Students can only see their own submissions
    if (user.role === "STUDENT" && studentId && studentId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    // Define the query conditions
    const whereConditions: any = {
      assignmentId,
    };
    
    // If studentId is provided, filter by student
    if (studentId) {
      whereConditions.studentId = studentId;
    }
    
    // If the user is a student, only show their submissions
    if (user.role === "STUDENT") {
      whereConditions.studentId = user.id;
    }
    
    const submissions = await prisma.submission.findMany({
      where: whereConditions,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignment: true,
      },
    });
    
    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { assignmentId, content, fileUrl, fileName, fileType, fileSize } = body;
    
    if (!assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      );
    }
    
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
    
    // Only students can submit assignments
    if (user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can submit assignments" },
        { status: 403 }
      );
    }
    
    // Check if the assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: {
        id: assignmentId,
      }
    });
    
    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }
    
    // Check if student is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: user.id,
        courseId: assignment.courseId,
      },
    });
    
    if (!enrollment) {
      return NextResponse.json(
        { error: "You are not enrolled in this course" },
        { status: 403 }
      );
    }
    
    // Check if the student has already submitted the assignment
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        studentId_assignmentId: {
          studentId: user.id,
          assignmentId,
        }
      }
    });
    
    if (existingSubmission) {
      return NextResponse.json(
        { error: "You have already submitted this assignment" },
        { status: 400 }
      );
    }
    
    // Determine if submission is late
    const isLate = new Date() > assignment.dueDate;
    
    // Create the submission
    const submission = await prisma.submission.create({
      data: {
        content,
        fileUrl,
        fileName,
        fileType,
        fileSize,
        isLate,
        student: {
          connect: {
            id: user.id,
          },
        },
        assignment: {
          connect: {
            id: assignmentId,
          },
        },
      },
    });
    
    // Update enrollment progress
    // For simplicity, we'll just set it to a percentage of completed assignments
    const totalAssignments = await prisma.assignment.count({
      where: {
        courseId: assignment.courseId,
      },
    });
    
    const completedAssignments = await prisma.submission.count({
      where: {
        student: {
          id: user.id,
        },
        assignment: {
          courseId: assignment.courseId,
        },
      },
    });
    
    const progress = Math.round((completedAssignments / totalAssignments) * 100);
    
    await prisma.enrollment.update({
      where: {
        studentId_courseId: {
          studentId: user.id,
          courseId: assignment.courseId,
        },
      },
      data: {
        progress,
      },
    });
    
    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
