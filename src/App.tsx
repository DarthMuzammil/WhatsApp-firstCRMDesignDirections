import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { Lead } from './data/demo'
import { MobileTabBar, MobileTopBar, Sidebar } from './components/AppNavigation'
import { navItemsFor, type View } from './components/navigation'
import { DemoGuide } from './components/DemoGuide'
import { ForwardShareSheet } from './components/ForwardShareSheet'
import { GROUP_MESSAGE_SAMPLES } from './lib/ai'
import { IncomingLeadBanner, type Arrival } from './components/IncomingLeadBanner'
import { Toast, useToast } from './components/Toast'
import { AddLeadModal } from './modals/AddLeadModal'
import { CallModal } from './modals/CallModal'
import { CallPicker } from './modals/CallPicker'
import { useDemoStore } from './state/useDemoStore'
import { ChatView } from './views/ChatView'
import { FollowUpsView } from './views/FollowUpsView'
import { PipelineView } from './views/PipelineView'
import { PropertiesView } from './views/PropertiesView'
import type { LaunchesTab } from './views/LaunchesView'
import type { BookingFilter } from './data/channelPartner'
import { TodayView } from './views/TodayView'
import { VisitsView } from './views/VisitsView'
import { lazyView } from './lib/lazyView'
import { ScreenBoundary } from './components/ScreenBoundary'
import './App.css'

// The screens an agent lives in (Today, chat, Visits, Pipeline, Properties, Follow-ups) ship in the first download.
// The heavier and less-visited screens are separate chunks (spec §7) that load when first opened, and are fetched in
// the background right after the first paint so opening them later is instant (see lib/lazyView).
const CallsView = lazyView(() => import('./views/CallsView').then((m) => m.CallsView))
const AttendanceView = lazyView(() => import('./views/AttendanceView').then((m) => m.AttendanceView))
const ReportsView = lazyView(() => import('./views/ReportsView').then((m) => m.ReportsView))
const EscalationsView = lazyView(() => import('./views/EscalationsView').then((m) => m.EscalationsView))
const LeadSourcesView = lazyView(() => import('./views/LeadSourcesView').then((m) => m.LeadSourcesView))
const TeamView = lazyView(() => import('./views/TeamView').then((m) => m.TeamView))
const SettingsView = lazyView(() => import('./views/SettingsView').then((m) => m.SettingsView))
const AuditView = lazyView(() => import('./views/AuditView').then((m) => m.AuditView))
const BrokerageView = lazyView(() => import('./views/BrokerageView').then((m) => m.BrokerageView))
const LaunchesView = lazyView(() => import('./views/LaunchesView').then((m) => m.LaunchesView))
const LAZY_BY_VIEW: Partial<Record<View, { preload: () => Promise<unknown>; retry: () => Promise<unknown> }>> = {
  calls: CallsView, attendance: AttendanceView, reports: ReportsView, escalations: EscalationsView, sources: LeadSourcesView,
  team: TeamView, settings: SettingsView, audit: AuditView, brokerage: BrokerageView, launches: LaunchesView,
}
const LAZY_VIEWS = Object.values(LAZY_BY_VIEW)

/** Shown for the moment a lazy screen takes to arrive (normally never seen, because the chunks are prefetched). */
function ScreenLoading() {
  return <section className="screen-loading" aria-busy="true" aria-label="Loading" />
}

/**
 * Bayana — WhatsApp-first CRM for brokerage teams (client demo prototype).
 * App owns navigation, the open lead, modals and toasts. Data and the current viewer live in useDemoStore.
 */
export default function App() {
  const store = useDemoStore()
  const { message: toast, notify } = useToast()
  const [view, setView] = useState<View>('today')
  // Optional starting point for the next screen (e.g. Brokerage opened on "Overdue" from Today).
  const [viewParam, setViewParam] = useState<string | undefined>()
  const [openLeadId, setOpenLeadId] = useState<number | null>(null)
  // Screen the chat was opened from: Back returns here and the nav keeps it highlighted.
  const [chatOrigin, setChatOrigin] = useState<Exclude<View, 'chat'>>('today')
  const [addLeadOpen, setAddLeadOpen] = useState(false)
  // M14: Add lead opened from the phone share sheet starts in paste mode with the forwarded message.
  const [addLeadPaste, setAddLeadPaste] = useState<string | null>(null)
  const [forwardOpen, setForwardOpen] = useState(false)
  const [callPickerOpen, setCallPickerOpen] = useState(false)
  const [callingLeadId, setCallingLeadId] = useState<number | null>(null)
  const [callSaved, setCallSaved] = useState(false)
  const [arrival, setArrival] = useState<Arrival | null>(null)
  const [demoOpen, setDemoOpen] = useState(false)
  const dismissArrival = useCallback(() => setArrival(null), [])
  const mainRef = useRef<HTMLElement>(null)

  const openLead = openLeadId === null ? undefined : store.findLead(openLeadId)
  const callingLead = callingLeadId === null ? undefined : store.findLead(callingLeadId)
  const navView: View = view === 'chat' ? chatOrigin : view

  // Switching "View as" can hide the open lead or a manager-only screen: fall back instead of showing nothing.
  const allowedViews = navItemsFor(store.viewerCan).map((item) => item.view)
  useEffect(() => {
    if (view === 'chat' && !openLead) setView(allowedViews.includes(chatOrigin) ? chatOrigin : 'today')
    else if (view !== 'chat' && !allowedViews.includes(view)) setView('today')
  }, [view, openLead, chatOrigin, allowedViews])

  // Start every screen at the top. Desktop scrolls <main>; phones scroll the window.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
    window.scrollTo({ top: 0 })
  }, [view, openLeadId])

  // Prefetch the lazy screens right after the first paint, so a tap later opens them instantly.
  // `data-screens="ready"` on <html> tells the end-to-end checks the prefetch is done.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      Promise.allSettled(LAZY_VIEWS.map((view) => view.preload())).then(() => { document.documentElement.dataset.screens = 'ready' })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  function navigate(next: View, param?: string) {
    // A screen whose download failed earlier (weak signal) gets a fresh attempt when it is opened.
    LAZY_BY_VIEW[next]?.retry().catch(() => undefined)
    setViewParam(param)
    setView(next === 'chat' && !openLead ? 'today' : next)
  }

  function showLead(lead: Lead) {
    if (view !== 'chat') setChatOrigin(view)
    store.markRead(lead.id)
    setOpenLeadId(lead.id)
    setView('chat')
  }

  /** Demo: a new enquiry arrives from a source (or the next connected one) and is announced. */
  function simulateLead(sourceName?: string) {
    const result = store.receiveLead(sourceName)
    if (result) setArrival(result)
    else notify('Connect a lead source to simulate an enquiry')
  }

  function startCall(lead: Lead) {
    setCallPickerOpen(false)
    setCallingLeadId(lead.id)
  }

  // Phones show an open chat full screen, like WhatsApp: no top bar or tab bar (Back returns).
  return (
    <div className={`app ${view === 'chat' ? 'is-chat' : ''}`}>
      <Sidebar store={store} view={navView} onNavigate={navigate} onAddLead={() => setAddLeadOpen(true)} onSimulateLead={simulateLead} onSimulateForward={() => setForwardOpen(true)} onStartDemo={() => setDemoOpen(true)} onOpenLead={showLead} />
      <MobileTopBar store={store} onNavigate={navigate} onAddLead={() => setAddLeadOpen(true)} onSimulateLead={simulateLead} onSimulateForward={() => setForwardOpen(true)} onStartDemo={() => setDemoOpen(true)} onOpenLead={showLead} />

      <main className="app-main" ref={mainRef}>
        <ScreenBoundary key={view} onRetry={() => { LAZY_BY_VIEW[view]?.retry().catch(() => undefined) }}>
        <Suspense fallback={<ScreenLoading />}>
        {view === 'today' && <TodayView store={store} onOpenLead={showLead} onNavigate={navigate} onCall={startCall} notify={notify} />}
        {view === 'chat' && openLead && <ChatView key={openLead.id} lead={openLead} store={store} onBack={() => setView(chatOrigin)} onCall={startCall} onNavigate={navigate} notify={notify} />}
        {view === 'visits' && <VisitsView store={store} onOpenLead={showLead} notify={notify} />}
        {view === 'pipeline' && <PipelineView store={store} onOpenLead={showLead} notify={notify} />}
        {view === 'properties' && <PropertiesView store={store} notify={notify} />}
        {view === 'tasks' && <FollowUpsView store={store} onOpenLead={showLead} onCall={startCall} notify={notify} />}
        {view === 'calls' && <CallsView store={store} onOpenLead={showLead} onNewCall={() => setCallPickerOpen(true)} />}
        {view === 'attendance' && <AttendanceView store={store} notify={notify} />}
        {view === 'reports' && <ReportsView store={store} onOpenLead={showLead} />}
        {view === 'escalations' && <EscalationsView store={store} onOpenLead={showLead} notify={notify} />}
        {view === 'sources' && <LeadSourcesView store={store} onSimulate={simulateLead} />}
        {view === 'team' && <TeamView store={store} notify={notify} />}
        {view === 'settings' && <SettingsView store={store} notify={notify} />}
        {view === 'audit' && <AuditView store={store} notify={notify} />}
        {view === 'launches' && <LaunchesView key={`${viewParam ?? 'default'}-${store.viewer.id}`} store={store} initialTab={viewParam as LaunchesTab | undefined} onOpenLead={showLead} notify={notify} />}
        {/* Brokerage params: a filter ("overdue"), optionally with a booking to open ("overdue#1"). */}
        {view === 'brokerage' && <BrokerageView key={viewParam ?? 'all'} store={store} initialFilter={viewParam?.split('#')[0] as BookingFilter | undefined} initialOpenId={viewParam?.includes('#') ? Number(viewParam.split('#')[1]) : undefined} notify={notify} />}
        </Suspense>
        </ScreenBoundary>
      </main>

      <MobileTabBar store={store} view={navView} onNavigate={navigate} />
      {demoOpen && <DemoGuide store={store} onSimulate={(source) => store.receiveLead(source)?.lead} onOpenLead={showLead} onNavigate={navigate} notify={notify} onClose={() => setDemoOpen(false)} />}
      <Toast message={toast} />
      {arrival && (
        <IncomingLeadBanner
          arrival={arrival}
          onDismiss={dismissArrival}
          onOpen={() => { const lead = store.findLead(arrival.lead.id); setArrival(null); if (lead) showLead(lead) }}
        />
      )}

      {addLeadOpen && <AddLeadModal store={store} onClose={() => { setAddLeadOpen(false); setAddLeadPaste(null) }} onOpenLead={showLead} initialMode={addLeadPaste ? 'paste' : 'type'} initialText={addLeadPaste ?? ''} />}
      {forwardOpen && <ForwardShareSheet message={GROUP_MESSAGE_SAMPLES[0]} onClose={() => setForwardOpen(false)} onShareToApp={() => { setForwardOpen(false); setAddLeadPaste(GROUP_MESSAGE_SAMPLES[0]); setAddLeadOpen(true) }} />}
      {callPickerOpen && <CallPicker leads={store.leads} onClose={() => setCallPickerOpen(false)} onChoose={startCall} />}
      {callingLead && (
        <CallModal
          lead={callingLead}
          onEnded={(duration) => { store.addRecording(callingLead.id, duration); setCallSaved(true) }}
          onClose={() => {
            // The recording is saved when the call ends; the toast waits until the end screen closes so it doesn't cover it.
            if (callSaved) notify('Call recording saved to the lead timeline')
            setCallSaved(false)
            setCallingLeadId(null)
          }}
        />
      )}
    </div>
  )
}
