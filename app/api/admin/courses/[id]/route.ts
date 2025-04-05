import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// Delete a course (admin only)
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
    
    // Check if user is an admin
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });
    
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    const courseId = params.id;
    
    // Delete the course and all related data
    await prisma.$transaction([
      // Delete all enrollments
      prisma.enrollment.deleteMany({
        where: { courseId },
      }),
      
      // Delete all submissions for assignments in this course
      prisma.submission.deleteMany({
        where: {
          assignment: {
            courseId,
          },
        },
      }),
      
      // Delete all assignments
      prisma.assignment.deleteMany({
        where: { courseId },
      }),
      
      // Delete all course materials
      prisma.courseMaterial.deleteMany({
        where: { courseId },
      }),
      
      // Finally delete the course
      prisma.course.delete({
        where: { id: courseId },
      }),
    ]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
