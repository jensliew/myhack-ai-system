import Link from "next/link";
import {
  ArrowRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeatureCarousel } from "@/components/landing/FeatureCarousel";
import { HeroMockup } from "@/components/landing/HeroMockup";
import { HeroAnalytics } from "@/components/landing/HeroAnalytics";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold text-primary">
            Nexora
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="cursor-pointer">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="cursor-pointer">
                Get Started
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section — with background image */}
      <section className="relative overflow-hidden">
        {/* Background image with less overlay to show more */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/blue-futuristic-waves-background-with-computer-code-technology_53876-119584.avif"
            alt=""
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background" />
        </div>

        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse z-0" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl animate-pulse z-0" style={{ animationDelay: "1s" }} />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl animate-pulse z-0" style={{ animationDelay: "2s" }} />

        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-6 pt-20 pb-16 text-center lg:pt-32 lg:pb-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary font-medium mb-6">
            <Zap className="h-3.5 w-3.5" />
            AI-Powered Ecosystem Intelligence
          </div>

          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Turn ecosystem chaos into{" "}
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              intelligent connections
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Nexora brings AI-powered intelligence to ecosystem management — from mentor matching
            and startup verification to engagement analytics and relationship tracking. All in one platform.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="cursor-pointer px-8 shadow-lg shadow-primary/25">
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="cursor-pointer px-8 bg-background/80 backdrop-blur">
                Sign in to Dashboard
              </Button>
            </Link>
          </div>

          {/* Dashboard Preview Mockup */}
          <HeroMockup />

          {/* AI Verification Animation */}
          <div className="mt-10 w-full max-w-3xl">
            <HeroAnalytics />
          </div>
        </div>
      </section>

      {/* Features Carousel */}
      <section className="relative py-20 overflow-hidden">
        {/* Background image + dark overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/blue-futuristic-waves-background-with-computer-code-technology_53876-119584.avif"
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-slate-900/85" />
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/8 rounded-full blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <span className="inline-block text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2">
              Platform Features
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                scale your ecosystem
              </span>
            </h2>
            <p className="mt-4 text-slate-300 max-w-2xl mx-auto text-lg">
              From AI-powered matching to real-time analytics — manage mentor-startup relationships at any scale.
            </p>
          </div>

          <FeatureCarousel />
        </div>
      </section>

      {/* Role Section */}
      <section className="py-20 relative overflow-hidden">
        {/* Gradient transition from dark features to light */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-background z-0" />
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-blue-300 uppercase tracking-wider mb-2">
              For Every Role
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Tailored experiences that{" "}
              <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                drive results
              </span>
            </h2>
            <p className="mt-4 text-blue-200/70 text-lg">
              Whether you&apos;re a startup, mentor, or administrator — Nexora adapts to your workflow.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <RoleCard
              title="For Startups"
              description="Receive AI-powered mentor recommendations tailored to your industry, stage, and goals. Accept or reject with full transparency into why each mentor was suggested."
              cta="Register as Startup"
              href="/register"
            />
            <RoleCard
              title="For Mentors"
              description="Discover startups aligned with your expertise. Browse, filter, and express interest. Build your mentorship portfolio with meaningful engagements."
              cta="Register as Mentor"
              href="/register"
            />
            <RoleCard
              title="For Admins"
              description="Monitor ecosystem health with AI-assisted verification, engagement analytics, and mentorship quality metrics. Make data-driven decisions."
              cta="Admin Login"
              href="/login"
            />
          </div>
        </div>
      </section>

      {/* CTA Section — with background image */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/f10785a6-8f9e-4857-9c38-5ad5cf97bdb5.webp"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/90" />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Ready to transform your ecosystem?
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Join Nexora and let AI handle the matching while you focus on building relationships that matter.
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="cursor-pointer px-8 shadow-lg">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Nexora — AI-Powered Ecosystem Intelligence
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">
              Login
            </Link>
            <Link href="/register" className="hover:text-foreground transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function RoleCard({
  title,
  description,
  cta,
  href,
}: {
  title: string;
  description: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="rounded-xl border bg-gradient-to-b from-background to-muted/30 p-8 flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">{title}</h3>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">
        {description}
      </p>
      <Link href={href} className="mt-6">
        <Button variant="outline" className="w-full cursor-pointer group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
          {cta}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
