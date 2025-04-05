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
    const courseId = searchParams.get("courseId");
    
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
    
    let assignments;
    
    if (courseId) {
      // Get assignments for a specific course
      assignments = await prisma.assignment.findMany({
        where: {
          courseId,
        },
        include: {
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
        orderBy: {
          dueDate: 'asc',
        },
      });
    } else if (user.role === "STUDENT") {
      // Get assignments for all courses the student is enrolled in
      const enrollments = await prisma.enrollment.findMany({
        where: {
          studentId: user.id,
        },
        select: {
          courseId: true,
        },
      });
      
      const courseIds = enrollments.map((enrollment: { courseId: string }) => enrollment.courseId);
      
      assignments = await prisma.assignment.findMany({
        where: {
          courseId: {
            in: courseIds,
          },
        },
        include: {
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
        orderBy: {
          dueDate: 'asc',
        },
      });
    } else if (user.role === "TEACHER") {
      // Get assignments for all courses the teacher teaches
      assignments = await prisma.assignment.findMany({
        where: {
          course: {
            teacherId: user.id,
          },
        },
        include: {
          course: true,
        },
        orderBy: {
          dueDate: 'asc',
        },
      });
    } else if (user.role === "ADMIN") {
      // Get all assignments
      assignments = await prisma.assignment.findMany({
        include: {
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
        orderBy: {
          dueDate: 'asc',
        },
      });
    }
    
    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
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
    const { title, description, dueDate, courseId } = body;
    
    if (!title || !description || !dueDate || !courseId) {
      return NextResponse.json(
        { error: "Title, description, due date, and course ID are required" },
        { status: 400 }
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
    
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
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
        { error: "Only the course teacher or an admin can create assignments" },
        { status: 403 }
      );
    }
    
    // Create the assignment
    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        courseId,
      },
    });
    
    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
