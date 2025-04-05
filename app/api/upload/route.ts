import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Create a directory for uploads if it doesn't exist
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get the request as FormData
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // "submission" or "material"
    
    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!type || (type !== "submission" && type !== "material")) {
      return NextResponse.json(
        { error: "Invalid upload type" },
        { status: 400 }
      );
    }

    // Generate a unique filename to prevent collisions
    const fileExtension = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // Create the upload directory path based on type
    const uploadDir = path.join(UPLOADS_DIR, type);
    const filePath = path.join(uploadDir, fileName);
    
    try {
      // Ensure directory exists
      await writeFile(filePath, new Uint8Array(await file.arrayBuffer()));
    } catch (error) {
      console.error("Error saving file:", error);
      return NextResponse.json(
        { error: "Error saving file" },
        { status: 500 }
      );
    }

    // Generate the relative URL to access the file
    const fileUrl = `/uploads/${type}/${fileName}`;
    
    return NextResponse.json({
      fileUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
