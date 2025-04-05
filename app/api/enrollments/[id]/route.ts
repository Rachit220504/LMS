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
    
    const enrollment = await prisma.enrollment.findUnique({
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
        course: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
    
    if (!enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
    }
    
    // Check authorization - teacher of the course, the enrolled student, or admin
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
    
    const isTeacher = enrollment.course.teacher.id === user.id;
    const isStudent = enrollment.student.id === user.id;
    const isAdmin = user.role === "ADMIN";
    
    if (!isTeacher && !isStudent && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(enrollment);
  } catch (error) {
    console.error("Error fetching enrollment:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    
    // First fetch the enrollment to check authorization
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        id: params.id,
      },
      include: {
        course: {
          select: {
            teacherId: true,
          },
        },
      },
    });
    
    if (!enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
    }
    
    // Only the teacher of the course or an admin can remove students
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
    
    const isTeacher = enrollment.course.teacherId === user.id;
    const isAdmin = user.role === "ADMIN";
    
    if (!isTeacher && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized. Only the course teacher or admin can remove students" },
        { status: 403 }
      );
    }
    
    // Delete the enrollment
    await prisma.enrollment.delete({
      where: {
        id: params.id,
      },
    });
    
    return NextResponse.json({
      message: "Student removed from course successfully",
    });
  } catch (error) {
    console.error("Error removing student from course:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
