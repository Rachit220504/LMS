import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Extend NextAuth types
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
  
  interface User {
    role?: string;
  }
}

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  
  if (!session?.user?.email) {
    return null;
  }
  
  return {
    ...session.user,
    role: session.user.role,
  };
}

export async function requireAuth() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }
  
  return session;
}

export async function requireAdmin() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }
  
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  
  return session;
}

export async function requireTeacher() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }
  
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  
  return session;
}

export async function requireStudent() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }
  
  if (session.user.role !== "STUDENT" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  
  return session;
}
