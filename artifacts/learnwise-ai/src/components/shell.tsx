import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import { 
  BookOpen, 
  BrainCircuit, 
  FileText, 
  Layers, 
  LayoutDashboard, 
  LogOut, 
  MessageSquare, 
  Settings, 
  StickyNote,
  TrendingUp, 
  User,
  Menu
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface ShellProps {
  children: ReactNode;
}

export function Shell({ children }: ShellProps) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "AI Tutor", href: "/ai-tutor", icon: MessageSquare },
    { name: "Quiz Generator", href: "/quiz-generator", icon: BrainCircuit },
    { name: "PDF Learning", href: "/pdf-learning", icon: FileText },
    { name: "Flashcards", href: "/flashcards", icon: Layers },
    { name: "Study Planner", href: "/study-planner", icon: BookOpen },
    { name: "Progress", href: "/progress", icon: TrendingUp },
    { name: "Notes", href: "/notes", icon: StickyNote },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-gray-100">
            <Link href="/dashboard" className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
              <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="LearnWise AI" className="h-8 w-8" />
              <span>LearnWise<span className="text-gray-900">AI</span></span>
            </Link>
          </div>
          
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href || location.startsWith(item.href + "/");
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-indigo-50 text-primary" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-gray-400")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100">
          <Link href="/profile" className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg hover:bg-gray-50 transition-colors">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt={user.fullName || "User"} className="h-9 w-9 rounded-full object-cover border border-gray-200" />
            ) : (
              <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-primary font-bold">
                {user?.firstName?.charAt(0) || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.fullName || "Student"}
              </p>
            </div>
          </Link>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
<div className="md:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">

  <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>

    <SheetTrigger asChild>
      <Button variant="ghost" size="icon">
        <Menu className="h-6 w-6" />
      </Button>
    </SheetTrigger>

    <SheetContent side="left" className="w-72 p-0">

      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-primary font-bold text-xl"
        >
          <img
            src={`${import.meta.env.BASE_URL}logo.svg`}
            alt="LearnWise AI"
            className="h-8 w-8"
          />
          <span>
            LearnWise<span className="text-gray-900">AI</span>
          </span>
        </Link>
      </div>

      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
          const isActive =
            location === item.href ||
            location.startsWith(item.href + "/");

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-indigo-50 text-primary"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-primary" : "text-gray-400"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 border-t border-gray-100">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

    </SheetContent>

  </Sheet>

  <Link
    href="/dashboard"
    className="flex items-center gap-2 text-primary font-bold text-xl"
  >
    <img
      src={`${import.meta.env.BASE_URL}logo.svg`}
      alt="LearnWise AI"
      className="h-8 w-8"
    />
    <span className="text-lg">LearnWiseAI</span>
  </Link>

  {user?.imageUrl ? (
    <img
      src={user.imageUrl}
      alt="User"
      className="h-8 w-8 rounded-full border border-gray-200"
    />
  ) : (
    <User className="h-8 w-8 text-gray-400" />
  )}

</div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
