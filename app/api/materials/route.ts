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
    
    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }
    
    // Check if the user has access to the course
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
    
    // If the user is a student, check if they're enrolled in the course
    if (user.role === "STUDENT") {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: user.id,
          courseId,
        },
      });
      
      if (!enrollment) {
        return NextResponse.json(
          { error: "You are not enrolled in this course" },
          { status: 403 }
        );
      }
    }
    
    // Get all materials for the course
    const materials = await prisma.courseMaterial.findMany({
      where: {
        courseId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return NextResponse.json(materials);
  } catch (error) {
    console.error("Error fetching course materials:", error);
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
    const { title, description, fileUrl, fileType, fileSize, courseId } = body;
    
    if (!title || !fileUrl || !courseId) {
      return NextResponse.json(
        { error: "Title, file URL, and course ID are required" },
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
        { error: "Only the course teacher or an admin can add materials" },
        { status: 403 }
      );
    }
    
    // Create the course material
    const material = await prisma.courseMaterial.create({
      data: {
        title,
        description,
        fileUrl,
        fileType,
        fileSize,
        courseId,
      },
    });
    
    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    console.error("Error creating course material:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
