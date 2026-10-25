import { Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'

import MainLayout from './layouts/MainLayout.jsx'
import AuthLayout from './layouts/AuthLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import Loader from './components/Loader.jsx'

import Home from './pages/Home.jsx'
import ExplorePoses from './pages/ExplorePoses.jsx'
import PoseDetail from './pages/PoseDetail.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import NotFound from './pages/NotFound.jsx'

// Heavier, feature-specific pages are split out of the initial bundle.
const AICoach = lazy(() => import('./pages/AICoach.jsx'))
const YogaPlans = lazy(() => import('./pages/YogaPlans.jsx'))
const BreathingStudio = lazy(() => import('./pages/BreathingStudio.jsx'))
const ProgressDashboard = lazy(() => import('./pages/ProgressDashboard.jsx'))
const MoodRecommendations = lazy(() => import('./pages/MoodRecommendations.jsx'))
const Assistant = lazy(() => import('./pages/Assistant.jsx'))
const Community = lazy(() => import('./pages/Community.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const Legal = lazy(() => import('./pages/Legal.jsx'))

export default function App() {
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <Suspense fallback={<Loader label="Loading…" />}>
        <Routes>
          {/* Public site */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/poses" element={<ExplorePoses />} />
            <Route path="/poses/:id" element={<PoseDetail />} />
            <Route path="/mood" element={<MoodRecommendations />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/community" element={<Community />} />
            <Route path="/privacy" element={<Legal page="privacy" />} />
            <Route path="/terms" element={<Legal page="terms" />} />
            <Route path="/safety" element={<Legal page="safety" />} />

            {/* Practice features require an account so progress can be saved */}
            <Route
              path="/coach"
              element={
                <ProtectedRoute>
                  <AICoach />
                </ProtectedRoute>
              }
            />
            <Route
              path="/plans"
              element={
                <ProtectedRoute>
                  <YogaPlans />
                </ProtectedRoute>
              }
            />
            <Route
              path="/breathing"
              element={
                <ProtectedRoute>
                  <BreathingStudio />
                </ProtectedRoute>
              }
            />
            <Route
              path="/progress"
              element={
                <ProtectedRoute>
                  <ProgressDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Authentication flows */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
