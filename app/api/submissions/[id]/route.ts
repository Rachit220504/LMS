import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
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
    
    // Find the submission
    const submission = await prisma.submission.findUnique({
      where: {
        id: params.id,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignment: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                teacherId: true,
              },
            },
          },
        },
      },
    });
    
    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }
    
    // Check if user has access to this submission
    // Teachers can only see submissions for courses they teach
    // Students can only see their own submissions
    const isTeacher = user.role === "TEACHER" && submission.assignment.course.teacherId === user.id;
    const isStudent = user.role === "STUDENT" && submission.studentId === user.id;
    const isAdmin = user.role === "ADMIN";
    
    if (!isTeacher && !isStudent && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(submission);
  } catch (error) {
    console.error("Error fetching submission:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// Method to update a submission (for grading)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { grade, feedback } = body;
    
    if (grade === undefined) {
      return NextResponse.json(
        { error: "Grade is required" },
        { status: 400 }
      );
    }
    
    if (grade < 0 || grade > 100) {
      return NextResponse.json(
        { error: "Grade must be between 0 and 100" },
        { status: 400 }
      );
    }
    
    // Find the submission
    const submission = await prisma.submission.findUnique({
      where: {
        id: params.id,
      },
      include: {
        assignment: {
          include: {
            course: true,
          },
        },
      },
    });
    
    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }
    
    // Check if the user is the teacher of the course or an admin
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
    
    if (submission.assignment.course.teacherId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only the course teacher or an admin can grade submissions" },
        { status: 403 }
      );
    }
    
    // Update the submission with grade and feedback
    const updatedSubmission = await prisma.submission.update({
      where: {
        id: params.id,
      },
      data: {
        grade,
        feedback,
        isGraded: true,
        gradedAt: new Date(),
      },
    });
    
    return NextResponse.json(updatedSubmission);
  } catch (error) {
    console.error("Error updating submission:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
