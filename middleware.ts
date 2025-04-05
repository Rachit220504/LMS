import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for protected routes
  const isProtected = 
    pathname.startsWith('/dashboard');
  
  if (isProtected) {
    const token = await getToken({ req: request });
    
    // If not authenticated, redirect to login
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', encodeURI(pathname));
      return NextResponse.redirect(url);
    }
    
    // Role-based access control
    if (pathname.startsWith('/dashboard/student') && 
        token.role !== 'STUDENT') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    if (pathname.startsWith('/dashboard/teacher') && 
        token.role !== 'TEACHER') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    if (pathname.startsWith('/dashboard/admin') && 
        token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// Configure the paths that require middleware
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/user/:path*'
  ],
};
