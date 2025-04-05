import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const AVATARS_DIR = path.join(process.cwd(), "public/uploads/avatars");

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    const formData = await request.formData();
    const file = formData.get("avatar") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }
    
    // Verify file is an image
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }
    
    // Get file extension
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const allowedExtensions = ["jpg", "jpeg", "png", "gif"];
    
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, JPEG, PNG, and GIF are allowed" },
        { status: 400 }
      );
    }
    
    // Generate unique filename
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = path.join(AVATARS_DIR, fileName);
    
    // Save the file
    await writeFile(filePath, new Uint8Array(await file.arrayBuffer()));
    
    // Get the user
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
    
    // Create public URL for the avatar
    const avatarUrl = `/uploads/avatars/${fileName}`;
    
    // Update user with new avatar URL
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        avatarUrl,
      },
    });
    
    return NextResponse.json({
      avatarUrl,
      message: "Avatar uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
