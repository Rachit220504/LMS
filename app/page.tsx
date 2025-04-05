import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-blue-600">LMS Portal</h1>
            </div>
            <div className="flex space-x-4">
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Learning Management System
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
              A comprehensive platform for students, teachers, and administrators
              to manage educational content and activities.
            </p>
            <div className="mt-10 flex justify-center gap-x-6">
              <Link href="/register">
                <Button size="lg" className="px-8 py-3 text-lg">
                  Get Started
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-3 text-lg"
                >
                  Log In
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">
                Features
              </h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Everything you need in one place
              </p>
            </div>

            <div className="mt-10">
              <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
                {/* Feature 1 */}
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900">
                    For Students
                  </h3>
                  <p className="mt-2 text-base text-gray-500">
                    Access courses, submit assignments, track progress, and
                    interact with teachers and peers.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900">
                    For Teachers
                  </h3>
                  <p className="mt-2 text-base text-gray-500">
                    Create courses, manage assignments, grade submissions, and
                    provide feedback to students.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900">
                    For Administrators
                  </h3>
                  <p className="mt-2 text-base text-gray-500">
                    Oversee all system activities, manage users, and ensure
                    smooth operation of the platform.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p>&copy; 2025 Learning Management System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
