import React, { useState } from 'react'
import type { AppConfig, Row } from '@shared/types'
import { newRow } from '@shared/types'

interface Props {
  config: AppConfig
  onConfigChange: (p: Partial<AppConfig>) => Promise<AppConfig>
}

export default function SellTab({ config, onConfigChange }: Props) {
  const [row, setRow] = useState<Row>(newRow())
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  const filePath = config.sellExcelFilePath
  const hasFile = Boolean(filePath)

  function setField<K extends keyof Row>(key: K, value: Row[K]) {
    setRow(prev => ({ ...prev, [key]: value }))
    setLastSaved(null)
  }

  function setNumField(key: 'prepaymentCash' | 'prepaymentDigital') {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, '').slice(0, 9)
      setField(key, val === '' ? 0 : parseInt(val))
    }
  }

  function numDisplay(val: number) {
    return val === 0 ? '' : String(val)
  }

  async function pickFile() {
    const path = await window.api.openExcelFile()
    if (path) await onConfigChange({ sellExcelFilePath: path })
  }

  async function handleSell() {
    if (!filePath) { setError('Сначала выберите файл таблицы продаж.'); return }
    if (!row.customerName.trim()) { setError('Укажите ФИО клиента.'); return }
    setBusy(true); setError(null); setLastSaved(null)
    try {
      const saved = await window.api.saveSellRow(filePath, row)
      setLastSaved(`✅ Сохранено — запись #${saved.id}`)
      setRow(newRow())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {/* File selector */}
      <div className="card">
        <h2>📁 Файл таблицы продаж</h2>
        <div className="file-row">
          <span className={`file-path ${hasFile ? '' : 'empty'}`}>
            <span className={`status-dot ${hasFile ? 'ok' : ''}`} />
            {filePath || 'Файл не выбран'}
          </span>
          <button className="btn-secondary btn-sm" onClick={pickFile} disabled={busy}>
            Обзор…
          </button>
        </div>
      </div>

      {error && <div className="error-banner">⚠ {error}</div>}
      {lastSaved && (
        <div style={{ color: '#27ae60', fontWeight: 600, marginBottom: 12, fontSize: 13 }}>
          {lastSaved}
        </div>
      )}

      <div className="card">
        <h2>Данные о продаже</h2>
        <div className="form-grid">
          <div className="field">
            <label>ФИО клиента</label>
            <input
              type="text"
              value={row.customerName}
              onChange={e => setField('customerName', e.target.value)}
              placeholder="Иванов Иван Иванович"
              disabled={busy}
            />
          </div>
          <div className="field">
            <label>Номер телефона</label>
            <input
              type="text"
              value={row.phone}
              onChange={e => setField('phone', e.target.value)}
              placeholder="+7 (000) 000-00-00"
              disabled={busy}
            />
          </div>
          <div className="field span-2">
            <label>Наименование товара</label>
            <input
              type="text"
              value={row.costumeName}
              onChange={e => setField('costumeName', e.target.value)}
              placeholder="Название"
              disabled={busy}
            />
          </div>
          <div className="field">
            <label>Оплата нал (₽)</label>
            <input
              type="text"
              inputMode="numeric"
              value={numDisplay(row.prepaymentCash)}
              onChange={setNumField('prepaymentCash')}
              placeholder="0"
              disabled={busy}
            />
          </div>
          <div className="field">
            <label>Оплата безнал (₽)</label>
            <input
              type="text"
              inputMode="numeric"
              value={numDisplay(row.prepaymentDigital)}
              onChange={setNumField('prepaymentDigital')}
              placeholder="0"
              disabled={busy}
            />
          </div>
          <div className="field span-2">
            <label>Комментарий</label>
            <textarea
              value={row.comment}
              onChange={e => setField('comment', e.target.value)}
              rows={2}
              placeholder="Дополнительные заметки…"
              disabled={busy}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="btn-row">
          <button
            className="btn-success"
            onClick={handleSell}
            disabled={busy || !hasFile}
          >
            {busy ? '⏳ Сохранение…' : '💾 Записать продажу'}
          </button>
          <button
            className="btn-secondary"
            onClick={() => { setRow(newRow()); setError(null); setLastSaved(null) }}
            disabled={busy}
          >
            🔄 Сброс
          </button>
        </div>
      </div>
    </>
  )
}
