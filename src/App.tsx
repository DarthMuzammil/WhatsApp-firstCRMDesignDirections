import { useEffect, useRef, useState } from 'react'
import type { Lead } from './data/demo'
import { MobileTabBar, MobileTopBar, Sidebar } from './components/AppNavigation'
import type { View } from './components/navigation'
import { Toast, useToast } from './components/Toast'
import { AddLeadModal } from './modals/AddLeadModal'
import { CallModal } from './modals/CallModal'
import { CallPicker } from './modals/CallPicker'
import { useDemoStore } from './state/useDemoStore'
import { CallsView } from './views/CallsView'
import { ChatView } from './views/ChatView'
import { FollowUpsView } from './views/FollowUpsView'
import { PipelineView } from './views/PipelineView'
import { PropertiesView } from './views/PropertiesView'
import { TodayView } from './views/TodayView'
import './App.css'

/**
 * Daira — WhatsApp-first CRM for independent brokers (client demo prototype).
 * App owns navigation, the open lead, modals and toasts. Data lives in useDemoStore.
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
  const mainRef = useRef<HTMLElement>(null)

  const openLead = openLeadId === null ? undefined : store.findLead(openLeadId)
  const callingLead = callingLeadId === null ? undefined : store.findLead(callingLeadId)
  const navView: View = view === 'chat' ? chatOrigin : view

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

  function startCall(lead: Lead) {
    setCallPickerOpen(false)
    setCallingLeadId(lead.id)
  }

  return (
    <div className="app">
      <Sidebar
        view={navView}
        onNavigate={navigate}
        unreadTotal={store.unreadTotal}
        leadsAwaitingReply={store.leadsAwaitingReply}
        tasksRemaining={store.remainingTasks.length}
        tasksTotal={store.tasks.length}
        onReset={store.resetDemo}
      />
      <MobileTopBar onNavigate={navigate} onAddLead={() => setAddLeadOpen(true)} onReset={store.resetDemo} />

      <main className="app-main" ref={mainRef}>
        {view === 'today' && <TodayView store={store} onOpenLead={showLead} onAddLead={() => setAddLeadOpen(true)} onNavigate={navigate} notify={notify} />}
        {view === 'chat' && openLead && <ChatView key={openLead.id} lead={openLead} store={store} onBack={() => setView(chatOrigin)} onCall={startCall} onNavigate={navigate} notify={notify} />}
        {view === 'pipeline' && <PipelineView store={store} onOpenLead={showLead} notify={notify} />}
        {view === 'properties' && <PropertiesView store={store} notify={notify} />}
        {view === 'tasks' && <FollowUpsView store={store} onOpenLead={showLead} onCall={startCall} />}
        {view === 'calls' && <CallsView store={store} onOpenLead={showLead} onNewCall={() => setCallPickerOpen(true)} />}
      </main>

      <MobileTabBar view={navView} onNavigate={navigate} unreadTotal={store.unreadTotal} />
      <Toast message={toast} />

      {addLeadOpen && <AddLeadModal onClose={() => setAddLeadOpen(false)} onSave={store.addLead} />}
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
