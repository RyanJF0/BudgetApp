import type { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import BudgetApp from './BudgetApp'
import { AuthPanel } from './components/AuthPanel'
import { Button } from './components/ui/button'
import { getSupabase } from './lib/supabase'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) {
      setLoading(false)
      return
    }

    void sb.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setLoading(false)
    })

    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading…
      </div>
    )
  }

  if (!getSupabase()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <AuthPanel />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <AuthPanel />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute top-4 right-4 z-10">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={() => void getSupabase()?.auth.signOut()}
        >
          Sign out
        </Button>
      </div>
      <BudgetApp userId={session.user.id} />
    </div>
  )
}
