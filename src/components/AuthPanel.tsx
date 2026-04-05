import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSupabase } from '@/lib/supabase'

export function AuthPanel() {
  const supabase = getSupabase()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!supabase) {
    return (
      <Card className="w-full max-w-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Configuration needed</CardTitle>
          <CardDescription>
            Add <code className="text-xs">VITE_SUPABASE_URL</code> and{' '}
            <code className="text-xs">VITE_SUPABASE_ANON_KEY</code> to{' '}
            <code className="text-xs">.env.local</code>, then restart the dev server.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const sb = getSupabase()
    if (!sb) return
    setErr(null)
    setSubmitting(true)
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setSubmitting(false)
    if (error) {
      setErr(error.message)
      return
    }
    setSent(true)
  }

  return (
    <Card className="w-full max-w-sm rounded-[2rem] border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Budget</CardTitle>
        <CardDescription>Sign in with a magic link sent to your email.</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <p className="text-muted-foreground text-sm">Check your email for the login link.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="auth-email">Email</Label>
              <Input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            {err ? <p className="text-destructive text-sm">{err}</p> : null}
            <Button type="submit" className="w-full rounded-xl" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send magic link'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
