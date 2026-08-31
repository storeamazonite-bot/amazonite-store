'use client'

import { useState } from 'react'

type Method = 'email' | 'sms' | 'whatsapp'

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('')
  const [method, setMethod] = useState<Method>('email')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')

    try {
      const response = await fetch('/api/recovery/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifier, method }),
      })
      const data = await response.json()
      setMessage(data.message ?? 'تمت معالجة الطلب.')
      if (response.ok && data.nextUrl) window.location.assign(data.nextUrl)
    } catch {
      setMessage('تعذر إتمام الطلب حالياً. حاول لاحقاً.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
      <section className="w-full rounded-2xl border p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">استرجاع الحساب</h1>
        <p className="mt-2 text-sm text-gray-600">اختر وسيلة الاسترجاع وأدخل البريد الإلكتروني أو رقم الهاتف.</p>
        <form onSubmit={submit} className="mt-6 space-y-5">
          <label className="block text-sm font-medium">
            البريد الإلكتروني أو رقم الهاتف
            <input className="mt-2 w-full rounded-lg border px-3 py-2" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoComplete="username" />
          </label>
          <fieldset>
            <legend className="text-sm font-medium">طريقة الاسترجاع</legend>
            <div className="mt-2 space-y-2">
              {(['email', 'sms', 'whatsapp'] as Method[]).map((value) => (
                <label key={value} className="flex items-center gap-2 text-sm">
                  <input type="radio" name="method" value={value} checked={method === value} onChange={() => setMethod(value)} />
                  {value === 'email' ? 'البريد الإلكتروني' : value === 'sms' ? 'SMS' : 'WhatsApp'}
                </label>
              ))}
            </div>
          </fieldset>
          <button disabled={busy} className="w-full rounded-lg border px-4 py-2 font-medium disabled:opacity-50">
            {busy ? 'جارٍ المعالجة…' : 'إرسال رمز الاسترجاع'}
          </button>
          {message && <p role="status" className="text-sm">{message}</p>}
        </form>
      </section>
    </main>
  )
}
