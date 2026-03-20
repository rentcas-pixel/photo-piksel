'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Pencil, Send, X } from 'lucide-react'

export type SuggestionContext = 'agency_home' | 'client' | 'campaign'

export interface FeatureSuggestionSectionProps {
  agencySlug: string
  context: SuggestionContext
  clientId?: string
  clientName?: string
  campaignId?: string
  campaignName?: string
}

export function FeatureSuggestionSection({
  agencySlug,
  context,
  clientId,
  clientName,
  campaignId,
  campaignName,
}: FeatureSuggestionSectionProps) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const close = useCallback(() => {
    setOpen(false)
    setMessage('')
    setStatus('idle')
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const submit = async () => {
    const trimmed = message.trim()
    if (trimmed.length < 3 || sending) return
    setSending(true)
    setStatus('idle')
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          agencySlug,
          context,
          clientId,
          clientName,
          campaignId,
          campaignName,
        }),
      })
      if (!res.ok) {
        setStatus('error')
        return
      }
      setStatus('success')
      setTimeout(() => close(), 1400)
    } catch {
      setStatus('error')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <section className="mt-auto pt-10 pb-4 border-t border-gray-200 shrink-0">
        <h2 className="text-xl font-bold text-gray-900 mb-6 leading-snug">
          Jūsų idėjos - svarbios
        </h2>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full text-left rounded-xl border-2 border-sky-200 bg-gray-50/80 hover:bg-gray-100/90 hover:border-sky-300 transition-colors px-5 py-4 flex items-start gap-4 shadow-sm"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-200/90">
            <Pencil className="h-5 w-5 text-gray-700" strokeWidth={2} />
          </div>
          <div className="min-w-0 pt-0.5">
            <p className="font-semibold text-gray-900">Pasiūlyti savo</p>
            <p className="text-sm text-gray-600 mt-0.5">
              Įrašykite norimą funkcionalumą
            </p>
          </div>
        </button>
      </section>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="suggestion-modal-title"
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[min(90vh,640px)] flex flex-col overflow-hidden border border-gray-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-gray-700" />
                <h3
                  id="suggestion-modal-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  Pasiūlyti savo
                </h3>
              </div>
              <button
                type="button"
                onClick={close}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                aria-label="Uždaryti"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-4 flex-1 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-3">
                Įrašykite norimą funkcionalumą
              </p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Rašykite čia"
                rows={8}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y min-h-[160px]"
                maxLength={4000}
                disabled={sending}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {message.length} / 4000
              </p>
              {status === 'success' && (
                <p className="text-sm text-green-600 mt-2 font-medium">
                  Ačiū — pasiūlymas išsiųstas.
                </p>
              )}
              {status === 'error' && (
                <p className="text-sm text-red-600 mt-2">
                  Nepavyko išsiųsti. Bandykite vėliau arba susisiekite su mumis tiesiogiai.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/80">
              <button
                type="button"
                onClick={close}
                disabled={sending}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Atgal
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={sending || message.trim().length < 3}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {sending ? (
                  'Siunčiama…'
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Siųsti
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
