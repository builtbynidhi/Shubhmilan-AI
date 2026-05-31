import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { CLERK_ENABLED, ClerkAuthBridge, NoAuthBridge } from "@/hooks/useAuth";
import PageLoader from "@/components/shared/PageLoader";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

// Lazy-loaded pages
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const BuilderPage = lazy(() => import("@/pages/BuilderPage"));
const KundliPage = lazy(() => import("@/pages/KundliPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const CalibratePage = lazy(() => import("@/pages/CalibratePage"));
const PalmReadingPage = lazy(() => import("@/pages/PalmReadingPage"));
const CompatibilityPage = lazy(() => import("@/pages/CompatibilityPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Auth init — mirrors Clerk → store (or unblocks loading in auth-disabled mode).
function AuthInit() {
  return CLERK_ENABLED ? <ClerkAuthBridge /> : <NoAuthBridge />;
}

// Route guards
interface RouteGuardProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: RouteGuardProps) {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: RouteGuardProps) {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <PageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthInit />
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/auth"
              element={
                <PublicRoute>
                  <AuthPage />
                </PublicRoute>
              }
            />
            {/* Public routes — no login required */}
            <Route path="/builder" element={<BuilderPage />} />
            <Route path="/kundli" element={<KundliPage />} />
            <Route path="/calibrate" element={<CalibratePage />} />
            <Route path="/palm" element={<PalmReadingPage />} />
            <Route path="/compatibility" element={<CompatibilityPage />} />
            {/* Protected — login required only to view saved data */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
