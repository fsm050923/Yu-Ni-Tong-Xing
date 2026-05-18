import { Routes, Route } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import HomePage from './pages/HomePage'
import MapPage from './pages/MapPage'
import PlannerPage from './pages/PlannerPage'
import AssistantPage from './pages/AssistantPage'
import ProfilePage from './pages/ProfilePage'
import ShareSheet from './components/sharing/ShareSheet'
import Toast from './components/ui/Toast'
import ToolCallToast from './components/agent/ToolCallToast'
import ProactiveCard from './components/agent/ProactiveCard'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      <ShareSheet />
      <Toast />
      <ToolCallToast />
      <ProactiveCard />
    </AppShell>
  )
}
