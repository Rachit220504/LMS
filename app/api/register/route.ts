import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { name, email, password, adminCode } = body;
    let role = body.role || "STUDENT";

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Check if trying to create admin account
    if (role === "ADMIN") {
      // Verify admin code
      const validAdminCode = process.env.ADMIN_SECRET_CODE;
      
      if (!adminCode || adminCode !== validAdminCode) {
        return NextResponse.json(
          { error: "Invalid admin verification code" },
          { status: 403 }
        );
      }
    }

    // Check if trying to create teacher account without admin code
    if (role === "TEACHER" && role !== "STUDENT") {
      // Allow teacher registration with admin code verification
      const validAdminCode = process.env.ADMIN_SECRET_CODE;
      
      if (!adminCode || adminCode !== validAdminCode) {
        // Default to STUDENT if no valid admin code provided
        role = "STUDENT";
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
