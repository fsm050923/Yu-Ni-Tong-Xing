import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import ErrorBoundary from './components/ui/ErrorBoundary'
import NetworkStatus from './components/ui/NetworkStatus'
import HomePage from './pages/HomePage'
import MapPage from './pages/MapPage'
import PlannerPage from './pages/PlannerPage'
import ProfilePage from './pages/ProfilePage'
import ShareSheet from './components/sharing/ShareSheet'
import MemoirCard from './components/sharing/MemoirCard'
import Toast from './components/ui/Toast'
import ToolCallToast from './components/agent/ToolCallToast'
import ProactiveCard from './components/agent/ProactiveCard'

export default function App() {
  return (
    <ErrorBoundary>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/assistant" element={<Navigate to="/" replace />} />
        </Routes>
        <ShareSheet />
        <MemoirCard />
        <Toast />
        <ToolCallToast />
        <ProactiveCard />
      </AppShell>
      <NetworkStatus />
    </ErrorBoundary>
  )
}
