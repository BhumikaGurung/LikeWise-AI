import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-extrabold text-primary mb-4">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Page not found</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
        </p>
        <Button asChild className="rounded-full shadow-sm hover:shadow px-8 h-12 bg-primary">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
