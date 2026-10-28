/* Integrator-owned. Route table. Screens are lazy-loaded from the files each module agent owns. */
import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Spinner } from '@/ui'
import { useActiveChild } from '@/data'
import EntryScreen from './EntryScreen'

// world-core
const ChildPickerScreen = lazy(() => import('@/world/picker/ChildPickerScreen'))
const OnboardingScreen = lazy(() => import('@/world/onboarding/OnboardingScreen'))
const ChildHomeScreen = lazy(() => import('@/world/home/ChildHomeScreen'))
const WorldMapScreen = lazy(() => import('@/world/map/WorldMapScreen'))
const NodeScreen = lazy(() => import('@/world/node/NodeScreen'))
// world-meta
const FreePlayScreen = lazy(() => import('@/world/free/FreePlayScreen'))
const DailyReviewScreen = lazy(() => import('@/world/review/DailyReviewScreen'))
const DailySessionScreen = lazy(() => import('@/world/session/DailySessionScreen'))
const PlacementScreen = lazy(() => import('@/world/placement/PlacementScreen'))
const ReadingRoute = lazy(() => import('@/world/lengua/ReadingRoute'))
const ClassLessonScreen = lazy(() => import('@/world/clase/ClassScreen'))
const AlbumScreen = lazy(() => import('@/world/album/AlbumScreen'))
const ShopScreen = lazy(() => import('@/world/shop/ShopScreen'))
const ChestScreen = lazy(() => import('@/world/chest/ChestScreen'))
const DiplomaScreen = lazy(() => import('@/world/diploma/DiplomaScreen'))
const PrizesScreen = lazy(() => import('@/world/prizes/PrizesScreen'))
// adult
const WelcomeScreen = lazy(() => import('@/adult/welcome/WelcomeScreen'))
const LoginScreen = lazy(() => import('@/adult/auth/LoginScreen'))
const SignupScreen = lazy(() => import('@/adult/auth/SignupScreen'))
const AdultGate = lazy(() => import('@/adult/gate/AdultGate'))
const AdultHomeScreen = lazy(() => import('@/adult/home/AdultHomeScreen'))
const ChildReportScreen = lazy(() => import('@/adult/child/ChildReportScreen'))
const SchoolScreen = lazy(() => import('@/adult/school/SchoolScreen'))
const ClassScreen = lazy(() => import('@/adult/school/ClassScreen'))
const JoinClassScreen = lazy(() => import('@/adult/join/JoinClassScreen'))
const SettingsScreen = lazy(() => import('@/adult/settings/SettingsScreen'))
const PrivacyScreen = lazy(() => import('@/adult/legal/PrivacyScreen'))
// dev
// Dev only: the conditional lets the production build drop the gallery and every *.gallery chunk.
const Gallery = import.meta.env.DEV ? lazy(() => import('@/dev/Gallery')) : null

/** Child area: requires a selected child profile on this device. */
function RequireChild({ children }: { children: ReactNode }) {
  const { child, loading } = useActiveChild()
  if (loading) return <Spinner />
  if (!child) return <Navigate to="/kids" replace />
  return <>{children}</>
}

/** Adult area: PIN / password gate so children don't wander into settings. */
function Adult({ children }: { children: ReactNode }) {
  return <AdultGate>{children}</AdultGate>
}

export function AppRoutes() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/" element={<EntryScreen />} />
        <Route path="/welcome" element={<WelcomeScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignupScreen />} />
        <Route path="/legal/privacidad" element={<PrivacyScreen />} />

        <Route path="/kids" element={<ChildPickerScreen />} />
        <Route path="/kids/new" element={<OnboardingScreen />} />

        <Route path="/play" element={<RequireChild><ChildHomeScreen /></RequireChild>} />
        <Route path="/play/w/:worldId" element={<RequireChild><WorldMapScreen /></RequireChild>} />
        <Route path="/play/w/:worldId/:nodeId" element={<RequireChild><NodeScreen /></RequireChild>} />
        <Route path="/play/free" element={<RequireChild><FreePlayScreen /></RequireChild>} />
        <Route path="/play/review" element={<RequireChild><DailyReviewScreen /></RequireChild>} />
        <Route path="/play/sesion" element={<RequireChild><DailySessionScreen /></RequireChild>} />
        <Route path="/play/lengua" element={<RequireChild><DailySessionScreen subject="language" /></RequireChild>} />
        <Route path="/play/lengua/leer/:id" element={<RequireChild><ReadingRoute /></RequireChild>} />
        <Route path="/play/prueba" element={<RequireChild><PlacementScreen /></RequireChild>} />
        <Route path="/play/prueba-lengua" element={<RequireChild><PlacementScreen subject="language" /></RequireChild>} />
        <Route path="/play/clase/:topicId" element={<RequireChild><ClassLessonScreen /></RequireChild>} />
        <Route path="/play/album" element={<RequireChild><AlbumScreen /></RequireChild>} />
        <Route path="/play/shop" element={<RequireChild><ShopScreen /></RequireChild>} />
        <Route path="/play/chest" element={<RequireChild><ChestScreen /></RequireChild>} />
        <Route path="/play/diploma" element={<RequireChild><DiplomaScreen /></RequireChild>} />
        <Route path="/play/premios" element={<RequireChild><PrizesScreen /></RequireChild>} />

        <Route path="/adult" element={<Adult><AdultHomeScreen /></Adult>} />
        <Route path="/adult/child/:childId" element={<Adult><ChildReportScreen /></Adult>} />
        <Route path="/adult/school" element={<Adult><SchoolScreen /></Adult>} />
        <Route path="/adult/class/:classId" element={<Adult><ClassScreen /></Adult>} />
        <Route path="/adult/join" element={<Adult><JoinClassScreen /></Adult>} />
        <Route path="/adult/settings" element={<Adult><SettingsScreen /></Adult>} />

        {Gallery && <Route path="/dev/gallery" element={<Gallery />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
