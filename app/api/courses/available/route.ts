import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    // Get the current session
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

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get courses where the user is NOT enrolled
    const availableCourses = await prisma.course.findMany({
        where: {
          students: {
            none: {
              studentId: user.id,
            },
          },
        },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              students: true, // Also update this to match
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json(availableCourses);
  } catch (error) {
    console.error("[AVAILABLE_COURSES_GET]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}