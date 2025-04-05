import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import path from "path";
import fs from "fs/promises";

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
    
    // Get the material
    const material = await prisma.courseMaterial.findUnique({
      where: {
        id: params.id,
      },
      include: {
        course: true,
      },
    });
    
    if (!material) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
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
          courseId: material.courseId,
        },
      });
      
      if (!enrollment) {
        return NextResponse.json(
          { error: "You are not enrolled in this course" },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(material);
  } catch (error) {
    console.error("Error fetching course material:", error);
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
    
    // Get the material
    const material = await prisma.courseMaterial.findUnique({
      where: {
        id: params.id,
      },
      include: {
        course: true,
      },
    });
    
    if (!material) {
      return NextResponse.json(
        { error: "Material not found" },
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
    
    if (material.course.teacherId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only the course teacher or an admin can delete materials" },
        { status: 403 }
      );
    }
    
    // Try to delete the actual file
    try {
      const filePath = path.join(process.cwd(), material.fileUrl.replace(/^\//, ''));
      await fs.unlink(filePath);
    } catch (error) {
      console.error("Error deleting file:", error);
      // Continue even if file deletion fails
    }
    
    // Delete the database entry
    await prisma.courseMaterial.delete({
      where: {
        id: params.id,
      },
    });
    
    return NextResponse.json({ message: "Material deleted successfully" });
  } catch (error) {
    console.error("Error deleting course material:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
