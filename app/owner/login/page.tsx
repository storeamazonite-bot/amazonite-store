'use client'

import { useState } from 'react'

export default function OwnerLoginPage() {
  const [method, setMethod] = useState<'phone' | 'email'>('phone')
  const [identifier, setIdentifier] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setStatus('')
    try {
      const res = await fetch('/api/owner/auth/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ method, identifier }),
      })
      const data = await res.json()
      setStatus(data.message ?? 'تمت معالجة الطلب.')
      if (res.ok && data.challengeId) {
        window.location.assign(`/owner/verify?challenge=${encodeURIComponent(data.challengeId)}`)
      }
    } catch {
      setStatus('تعذر إتمام الطلب حالياً. حاول لاحقاً.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <section className="w-full rounded-2xl border p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">دخول المالك</h1>
        <p className="mt-2 text-sm text-gray-600">الوصول مخصص لحساب مالك المنصة الموثق.</p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setMethod('phone')} className="rounded-lg border px-3 py-2">الهاتف</button>
          <button type="button" onClick={() => setMethod('email')} className="rounded-lg border px-3 py-2">البريد</button>
        </div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block text-sm font-medium">
            {method === 'phone' ? 'رقم الهاتف (+212...)' : 'البريد الإلكتروني'}
            <input className="mt-2 w-full rounded-lg border px-3 py-2" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoComplete="username" />
          </label>
          <button disabled={busy} className="w-full rounded-lg border px-4 py-2 font-medium disabled:opacity-50">
            {busy ? 'جارٍ الإرسال…' : 'إرسال رمز التحقق'}
          </button>
          {status && <p role="status" className="text-sm">{status}</p>}
        </form>
      </section>
    </main>
  )
}
