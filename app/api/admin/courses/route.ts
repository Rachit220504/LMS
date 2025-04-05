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
    
    // Add detailed logging
    console.log("Admin courses API called by:", session.user.email);
    
    // Get the current user
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });
    
    if (!user) {
      console.error("User not found:", session.user.email);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    if (user.role !== "ADMIN") {
      console.error("Unauthorized access attempt by:", user.email, "Role:", user.role);
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }
    
    // Simplify the query to reduce potential errors
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        createdAt: true,
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            students: true,
            assignments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    console.log(`Successfully fetched ${courses.length} courses`);
    return NextResponse.json(courses);
  } catch (error) {
    // Enhanced error logging
    console.error("Error in admin courses API:", error);
    
    // Return a more descriptive error
    return NextResponse.json(
      { 
        error: "Failed to fetch courses", 
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
