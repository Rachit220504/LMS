"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-16">
      <div className="rounded-full bg-red-100 p-6 mb-6">
        <AlertCircle className="h-16 w-16 text-red-600" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight text-center">Something went wrong!</h1>
      <p className="mt-4 text-center text-gray-500 max-w-md">
        An unexpected error has occurred. Our team has been notified and is working on a fix.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <Button variant="outline" onClick={() => reset()}>
          Try again
        </Button>
        <Button asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
