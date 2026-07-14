import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  ArrowRight, 
  BrainCircuit, 
  CheckCircle2, 
  FileText, 
  Layers, 
  LayoutDashboard, 
  Sparkles,
  TrendingUp,
  MessageSquare
} from "lucide-react";
import { motion } from "framer-motion";
import heroIllustration from "@assets/generated_images/hero-illustration.jpg";

export default function LandingPage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="LearnWise AI" className="h-8 w-8" />
            <span className="font-bold text-xl tracking-tight text-primary">LearnWise<span className="text-gray-900">AI</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              Sign In
            </Link>
            <Link href="/sign-up" className="inline-flex items-center justify-center rounded-full text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 shadow-sm hover:shadow">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-white to-white -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold mb-6">
                <Sparkles className="h-4 w-4" />
                <span>Your intelligent study companion</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
                Learn Smarter. <br/>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  Practice Better.
                </span> <br/>
                Achieve More.
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-lg">
                Upload your syllabus, chat with your AI tutor, and let LearnWise generate flashcards and quizzes automatically. It's like having a world-class study group available 24/7.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/sign-up" className="inline-flex items-center justify-center rounded-full text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 shadow-md hover:shadow-lg hover:-translate-y-0.5 duration-200">
                  Start Learning for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link href="#features" className="inline-flex items-center justify-center rounded-full text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900 h-12 px-8 shadow-sm">
                  See how it works
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-4 text-sm text-gray-500 font-medium">
                <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> No credit card required</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> Cancel anytime</div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative lg:ml-auto"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-[2.5rem] blur-2xl -z-10"></div>
              <img 
                src={heroIllustration} 
                alt="Student using LearnWise AI" 
                className="rounded-2xl shadow-2xl border border-gray-100 object-cover aspect-square sm:aspect-[4/3] w-full max-w-lg mx-auto"
              />
              
              {/* Floating badges */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, type: "spring" }}
                className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-gray-100 flex items-center gap-4"
              >
                <div className="bg-green-100 p-2 rounded-lg text-green-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">+47%</div>
                  <div className="text-xs text-gray-500">Average Grade Increase</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-gray-50 border-y border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">Everything you need to master your material</h2>
            <p className="text-lg text-gray-600">Stop wasting time organizing notes. We turn your materials into an active, personalized learning experience instantly.</p>
          </div>

          <motion.div 
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              {
                icon: FileText,
                title: "PDF Intelligence",
                description: "Upload any textbook chapter, slides, or syllabus. We extract the core concepts automatically.",
                color: "bg-blue-100 text-blue-600"
              },
              {
                icon: BrainCircuit,
                title: "Smart Quizzes",
                description: "Test yourself before the exam. Adaptive quizzes find your weak spots and focus on them.",
                color: "bg-purple-100 text-purple-600"
              },
              {
                icon: Layers,
                title: "Magic Flashcards",
                description: "Turn your PDFs into spaced-repetition flashcards in one click. Review them on any device.",
                color: "bg-orange-100 text-orange-600"
              },
              {
                icon: MessageSquare,
                title: "24/7 AI Tutor",
                description: "Stuck on a concept? Chat with a tutor that knows exactly what you're studying and explains it simply.",
                color: "bg-indigo-100 text-indigo-600"
              },
              {
                icon: LayoutDashboard,
                title: "Study Planner",
                description: "Input your exam dates and let LearnWise build a sustainable weekly study schedule for you.",
                color: "bg-emerald-100 text-emerald-600"
              },
              {
                icon: TrendingUp,
                title: "Progress Analytics",
                description: "Watch your competence grow. Detailed charts track your study hours and mastery levels.",
                color: "bg-rose-100 text-rose-600"
              }
            ].map((feature, i) => (
              <motion.div key={i} variants={item} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-6 ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary -z-20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent -z-10"></div>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">Ready to ace your next exam?</h2>
          <p className="text-indigo-100 text-xl mb-10 max-w-2xl mx-auto">
            Join thousands of students who have upgraded their study routine with LearnWise AI.
          </p>
          <Link href="/sign-up" className="inline-flex items-center justify-center rounded-full text-lg font-bold transition-transform hover:-translate-y-1 bg-white text-primary h-14 px-10 shadow-xl">
            Create Your Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="LearnWise AI" className="h-6 w-6 opacity-50 grayscale" />
            <span className="font-bold text-gray-400">LearnWise AI</span>
          </div>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} LearnWise AI. Crafted for students.
          </p>
        </div>
      </footer>
    </div>
  );
}
