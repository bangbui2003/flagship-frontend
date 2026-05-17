import Link from "next/link";
import {
  Flag,
  Zap,
  Users,
  BarChart3,
  Shield,
  Code,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const features = [
    {
      icon: Flag,
      title: "Feature Flags",
      description:
        "Control feature rollouts with powerful targeting rules and percentage-based releases.",
    },
    {
      icon: Users,
      title: "User Segments",
      description:
        "Create dynamic user segments based on attributes for precise targeting.",
    },
    {
      icon: Zap,
      title: "Real-time Updates",
      description:
        "Instant flag updates via Server-Sent Events without redeployment.",
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description:
        "Track flag evaluations, user exposure, and variation distribution.",
    },
    {
      icon: Shield,
      title: "Environment Safety",
      description:
        "Separate configurations for development, staging, and production.",
    },
    {
      icon: Code,
      title: "SDK Support",
      description:
        "Easy integration with JavaScript, React, Node.js, and REST API.",
    },
  ];

  const highlights = [
    "Redis-backed caching for sub-millisecond evaluations",
    "Scheduled flag changes with automatic execution",
    "Comprehensive audit logging for compliance",
    "Webhook integrations for external notifications",
    "Role-based access control (RBAC)",
    "Multi-environment support",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Flag className="h-6 w-6 text-primary" />
            <span className="text-xl">Flagship</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Zap className="h-4 w-4" />
          Modern Feature Flag Platform
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
          Ship Features with
          <br />
          <span className="text-primary">Confidence</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Flagship is a powerful feature flag management platform that helps you
          control feature rollouts, run A/B tests, and deliver personalized
          experiences.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/auth/register">
              Start Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/projects">View Demo</Link>
          </Button>
        </div>

        {/* Demo credentials */}
        <div className="mt-8 p-4 bg-muted rounded-lg inline-block">
          <p className="text-sm text-muted-foreground">
            <strong>Demo credentials:</strong> admin@flagship.dev / admin123
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">
            Everything you need for feature management
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A complete solution for controlling feature releases, targeting
            users, and measuring impact.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Highlights */}
      <section className="container mx-auto px-4 py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">
              Built for developers, loved by teams
            </h2>
            <p className="text-muted-foreground mb-8">
              Flagship combines powerful features with an intuitive interface,
              making it easy for your entire team to manage feature releases.
            </p>
            <ul className="space-y-4">
              {highlights.map((highlight) => (
                <li key={highlight} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-card border rounded-xl p-8">
            <pre className="text-sm overflow-x-auto">
              <code className="text-muted-foreground">{`// Check if feature is enabled
const isEnabled = client.isEnabled(
  'new-checkout-flow',
  {
    key: user.id,
    attributes: {
      plan: user.plan,
      country: user.country,
    },
  }
);

if (isEnabled) {
  // Show new checkout
  return <NewCheckout />;
} else {
  // Show existing checkout
  return <LegacyCheckout />;
}`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-24">
        <div className="bg-primary rounded-2xl p-12 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Start managing your feature flags today. No credit card required.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/auth/register">
              Create Free Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-primary" />
              <span className="font-semibold">Flagship</span>
            </div>
            <p className="text-sm text-muted-foreground">
              A portfolio project demonstrating feature flag management.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/projects" className="hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/auth/login" className="hover:text-foreground">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
