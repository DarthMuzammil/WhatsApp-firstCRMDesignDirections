import { useCallback, useEffect, useRef, useState } from 'react'
import type { Lead } from './data/demo'
import { MobileTabBar, MobileTopBar, Sidebar } from './components/AppNavigation'
import { navItemsFor, type View } from './components/navigation'
import { DemoGuide } from './components/DemoGuide'
import { IncomingLeadBanner, type Arrival } from './components/IncomingLeadBanner'
import { Toast, useToast } from './components/Toast'
import { AddLeadModal } from './modals/AddLeadModal'
import { CallModal } from './modals/CallModal'
import { CallPicker } from './modals/CallPicker'
import { useDemoStore } from './state/useDemoStore'
import { AttendanceView } from './views/AttendanceView'
import { CallsView } from './views/CallsView'
import { EscalationsView } from './views/EscalationsView'
import { LeadSourcesView } from './views/LeadSourcesView'
import { ChatView } from './views/ChatView'
import { FollowUpsView } from './views/FollowUpsView'
import { PipelineView } from './views/PipelineView'
import { PropertiesView } from './views/PropertiesView'
import { ReportsView } from './views/ReportsView'
import { SettingsView } from './views/SettingsView'
import { AuditView } from './views/AuditView'
import { TeamView } from './views/TeamView'
import { TodayView } from './views/TodayView'
import { VisitsView } from './views/VisitsView'
import './App.css'

/**
 * Daira — WhatsApp-first CRM for brokerage teams (client demo prototype).
 * App owns navigation, the open lead, modals and toasts. Data and the current viewer live in useDemoStore.
 */
export default function App() {
  const store = useDemoStore()
  const { message: toast, notify } = useToast()
  const [view, setView] = useState<View>('today')
  const [openLeadId, setOpenLeadId] = useState<number | null>(null)
  // Screen the chat was opened from: Back returns here and the nav keeps it highlighted.
  const [chatOrigin, setChatOrigin] = useState<Exclude<View, 'chat'>>('today')
  const [addLeadOpen, setAddLeadOpen] = useState(false)
  const [callPickerOpen, setCallPickerOpen] = useState(false)
  const [callingLeadId, setCallingLeadId] = useState<number | null>(null)
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

  function navigate(next: View) {
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

  return (
    <div className="app">
      <Sidebar store={store} view={navView} onNavigate={navigate} onSimulateLead={simulateLead} onStartDemo={() => setDemoOpen(true)} onOpenLead={showLead} />
      <MobileTopBar store={store} onNavigate={navigate} onAddLead={() => setAddLeadOpen(true)} onSimulateLead={simulateLead} onStartDemo={() => setDemoOpen(true)} onOpenLead={showLead} />

      <main className="app-main" ref={mainRef}>
        {view === 'today' && <TodayView store={store} onOpenLead={showLead} onAddLead={() => setAddLeadOpen(true)} onNavigate={navigate} notify={notify} />}
        {view === 'chat' && openLead && <ChatView key={openLead.id} lead={openLead} store={store} onBack={() => setView(chatOrigin)} onCall={startCall} onNavigate={navigate} notify={notify} />}
        {view === 'visits' && <VisitsView store={store} onOpenLead={showLead} notify={notify} />}
        {view === 'pipeline' && <PipelineView store={store} onOpenLead={showLead} notify={notify} />}
        {view === 'properties' && <PropertiesView store={store} notify={notify} />}
        {view === 'tasks' && <FollowUpsView store={store} onOpenLead={showLead} onCall={startCall} />}
        {view === 'calls' && <CallsView store={store} onOpenLead={showLead} onNewCall={() => setCallPickerOpen(true)} />}
        {view === 'attendance' && <AttendanceView store={store} notify={notify} />}
        {view === 'reports' && <ReportsView store={store} onOpenLead={showLead} onNavigate={navigate} />}
        {view === 'escalations' && <EscalationsView store={store} onOpenLead={showLead} notify={notify} />}
        {view === 'sources' && <LeadSourcesView store={store} onSimulate={simulateLead} />}
        {view === 'team' && <TeamView store={store} notify={notify} />}
        {view === 'settings' && <SettingsView store={store} notify={notify} />}
        {view === 'audit' && <AuditView store={store} notify={notify} />}
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

      {addLeadOpen && <AddLeadModal store={store} onClose={() => setAddLeadOpen(false)} onOpenLead={showLead} />}
      {callPickerOpen && <CallPicker leads={store.leads} onClose={() => setCallPickerOpen(false)} onChoose={startCall} />}
      {callingLead && (
        <CallModal
          lead={callingLead}
          onClose={() => setCallingLeadId(null)}
          onSave={(duration) => {
            store.addRecording(callingLead.id, duration)
            setCallingLeadId(null)
            notify('Call recording saved to the lead timeline')
          }}
        />
      )}
    </div>
  )
}
