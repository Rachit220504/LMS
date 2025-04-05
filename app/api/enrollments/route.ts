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
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const studentId = searchParams.get("studentId");
    
    if (!courseId && !studentId) {
      return NextResponse.json(
        { error: "Either courseId or studentId is required" },
        { status: 400 }
      );
    }
    
    // Get current user
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
    
    // Build the query
    let where: any = {};
    
    if (courseId) {
      where.courseId = courseId;
      
      // For students, only show their own enrollments
      if (user.role === "STUDENT") {
        where.studentId = user.id;
      }
      
      // For teachers, verify they teach this course
      if (user.role === "TEACHER") {
        const course = await prisma.course.findUnique({
          where: {
            id: courseId,
          },
          select: {
            teacherId: true,
          },
        });
        
        if (!course) {
          return NextResponse.json(
            { error: "Course not found" },
            { status: 404 }
          );
        }
        
        if (course.teacherId !== user.id) {
          return NextResponse.json(
            { error: "You do not have permission to access this course's enrollments" },
            { status: 403 }
          );
        }
      }
    }
    
    if (studentId) {
      where.studentId = studentId;
      
      // Students can only see their own enrollments
      if (user.role === "STUDENT" && studentId !== user.id) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 403 }
        );
      }
    }
    
    // Get enrollments
    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return NextResponse.json(enrollments);
  } catch (error) {
    console.error("Error fetching enrollments:", error);
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
    const { studentId, courseId } = body;
    
    if (!studentId || !courseId) {
      return NextResponse.json(
        { error: "Student ID and Course ID are required" },
        { status: 400 }
      );
    }
    
    // Get current user
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
    
    // Check if user is allowed to add enrollments (teacher of the course or admin)
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
      select: {
        teacherId: true,
      },
    });
    
    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }
    
    if (course.teacherId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only the course teacher or an admin can add students" },
        { status: 403 }
      );
    }
    
    // Check if the student exists
    const student = await prisma.user.findUnique({
      where: {
        id: studentId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });
    
    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }
    
    // Check if the student is already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });
    
    if (existingEnrollment) {
      return NextResponse.json(
        { error: "Student is already enrolled in this course" },
        { status: 400 }
      );
    }
    
    // Create the enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        courseId,
        progress: 0,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
      },
    });
    
    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error("Error creating enrollment:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
