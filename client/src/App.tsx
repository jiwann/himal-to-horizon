import { Switch, Route } from "wouter";
import { Component, lazy, Suspense, useEffect, type ReactNode } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/language-context";
import { CurrencyProvider } from "@/contexts/currency-context";
import { AuthProvider } from "@/contexts/auth-context";
import { setTravelpayoutsMarker } from "@/lib/affiliate";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import ResultsPage from "@/pages/results";
import ProfilePage from "@/pages/profile";
import PrivacyPage from "@/pages/privacy";
import TermsPage from "@/pages/terms";
import AffiliateDisclosurePage from "@/pages/affiliate-disclosure";
import AboutPage from "@/pages/about";
import VisaGuidesPage from "@/pages/visa-guides";
import VisaCheckPage from "@/pages/visa-check";
import VisaDifficultyPage from "@/pages/visa-difficulty";
import VisaFreePage from "@/pages/visa-free";
import VisaEvisaPage from "@/pages/visa-evisa";
import BlogPage from "@/pages/blog";
import BlogPostPage from "@/pages/blog-post";
import StaysPage from "@/pages/stays";
import HotelsPage from "@/pages/hotels";
import FlightsPage from "@/pages/flights";
import CarsPage from "@/pages/cars";
import InsurancePage from "@/pages/insurance";
import ActivitiesPage from "@/pages/activities";
import AdminPage from "@/pages/admin";
import CommunityPage from "@/pages/community";
import CommunityDestinationPage from "@/pages/community-destination";
import CommunityPostPage from "@/pages/community-post";
import CommunityNewPage from "@/pages/community-new";

const BookingPage = lazy(() => import("@/pages/booking"));

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", background: "hsl(211 60% 8%)", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#F7B088" }}>Something went wrong</h1>
          <p style={{ marginBottom: "0.5rem", opacity: 0.7 }}>Please refresh the page to try again.</p>
          <pre style={{ fontSize: "0.75rem", opacity: 0.5, marginTop: "1rem", maxWidth: "600px", overflowX: "auto", textAlign: "left" }}>{this.state.error.message}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: "1.5rem", padding: "0.5rem 1.5rem", background: "#F7B088", color: "#000", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: 600 }}>
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AffiliateInitializer() {
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((cfg) => {
        if (cfg?.travelpayoutsMarker) setTravelpayoutsMarker(cfg.travelpayoutsMarker);
      })
      .catch(() => {});
  }, []);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/results" component={ResultsPage} />
      <Route path="/booking">
        <Suspense fallback={<div style={{ minHeight: "100vh", background: "hsl(211 60% 8%)" }} />}>
          <BookingPage />
        </Suspense>
      </Route>
      <Route path="/profile" component={ProfilePage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/affiliate-disclosure" component={AffiliateDisclosurePage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/visa-guides" component={VisaGuidesPage} />
      <Route path="/visa-guides/difficulty" component={VisaDifficultyPage} />
      <Route path="/visa-guides/visa-free" component={VisaFreePage} />
      <Route path="/visa-guides/evisa" component={VisaEvisaPage} />
      <Route path="/visa/:passport/:destination" component={VisaCheckPage} />
      <Route path="/blog" component={BlogPage} />
      <Route path="/blog/:slug" component={BlogPostPage} />
      <Route path="/stays" component={StaysPage} />
      <Route path="/hotels" component={HotelsPage} />
      <Route path="/flights" component={FlightsPage} />
      <Route path="/cars" component={CarsPage} />
      <Route path="/insurance" component={InsurancePage} />
      <Route path="/activities" component={ActivitiesPage} />
      <Route path="/community" component={CommunityPage} />
      <Route path="/community/new" component={CommunityNewPage} />
      <Route path="/community/edit/:id" component={CommunityNewPage} />
      <Route path="/community/post/:id" component={CommunityPostPage} />
      <Route path="/community/:cc/:city" component={CommunityDestinationPage} />
      <Route path="/community/:cc" component={CommunityDestinationPage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <TooltipProvider>
              <ErrorBoundary>
                <AffiliateInitializer />
                <Toaster />
                <Router />
              </ErrorBoundary>
            </TooltipProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
