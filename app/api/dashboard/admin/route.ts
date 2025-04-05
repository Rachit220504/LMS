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
    
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    // Get total counts
    const [
      totalStudents,
      totalTeachers,
      totalCourses,
      totalEnrollments
    ] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "TEACHER" } }),
      prisma.course.count(),
      prisma.enrollment.count(),
    ]);
    
    // Get top courses
    const topCourses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        teacher: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: {
        students: {
          _count: "desc",
        },
      },
      take: 5,
    });
    
    // Format top courses data
    const formattedTopCourses = topCourses.map(course => ({
      id: course.id,
      title: course.title,
      teacherName: course.teacher.name,
      students: course._count.students,
    }));
    
    return NextResponse.json({
      totalStudents,
      totalTeachers,
      totalCourses,
      totalEnrollments,
      topCourses: formattedTopCourses,
    });
    
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
