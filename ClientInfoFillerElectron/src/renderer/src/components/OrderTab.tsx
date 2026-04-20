import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { AppConfig, Row } from '@shared/types'
import { calcOwe, newRow } from '@shared/types'

interface Props {
  config: AppConfig
  onConfigChange: (p: Partial<AppConfig>) => Promise<AppConfig>
}

// Convert ISO string to the value format required by <input type="date"> (YYYY-MM-DD)
function isoToInput(iso: string): string {
  return iso.slice(0, 10)
}

function inputToIso(val: string): string {
  // <input type="date"> returns YYYY-MM-DD; turn into midnight local ISO
  const d = new Date(val + 'T00:00:00')
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

export default function OrderTab({ config, onConfigChange }: Props) {
  const [row, setRow] = useState<Row>(newRow())
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [autocomplete, setAutocomplete] = useState<{ names: string[]; phones: string[] }>({
    names: [],
    phones: [],
  })

  const filePath = config.mainExcelFilePath
  const hasFile = Boolean(filePath)
  const isNewRow = row.rowPos === -1
  const owe = calcOwe(row)

  // Load autocomplete data whenever the excel file changes
  const loadAutocomplete = useCallback(async (path: string) => {
    if (!path) return
    try {
      const data = await window.api.getAutocomplete(path)
      setAutocomplete(data)
    } catch {
      // Non-critical — autocomplete just won't work
    }
  }, [])

  useEffect(() => {
    loadAutocomplete(filePath)
  }, [filePath, loadAutocomplete])

  // ── helpers ─────────────────────────────────────────────────────────────────

  function setField<K extends keyof Row>(key: K, value: Row[K]) {
    setRow(prev => ({ ...prev, [key]: value }))
  }

  function setNumField(key: 'price' | 'prepaymentCash' | 'prepaymentDigital' | 'pledgeCash' | 'pledgeDigital') {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, '').slice(0, 9)
      setField(key, val === '' ? 0 : parseInt(val))
    }
  }

  function numDisplay(val: number) {
    return val === 0 ? '' : String(val)
  }

  // ── file picker ──────────────────────────────────────────────────────────────

  async function pickFile() {
    const path = await window.api.openExcelFile()
    if (path) {
      await onConfigChange({ mainExcelFilePath: path })
      await loadAutocomplete(path)
    }
  }

  // ── actions ──────────────────────────────────────────────────────────────────

  async function handleSave(andPrint = false) {
    if (!filePath) { setError('Сначала выберите файл таблицы.'); return }
    setBusy(true); setError(null)
    try {
      const saved = await window.api.saveRow(filePath, row)
      if (isNewRow || andPrint) {
        await window.api.fillAndPrint(saved)
      }
      // If it was a new row, reset the form after saving
      if (isNewRow) {
        setRow(newRow())
        await loadAutocomplete(filePath)
      } else {
        // Stay in edit mode with updated data
        setRow(saved)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  function handleReset() {
    setRow(newRow())
    setError(null)
  }

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Excel file selector */}
      <div className="card">
        <h2>📁 Файл таблицы заказов</h2>
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

      {/* Error banner */}
      {error && <div className="error-banner">⚠ {error}</div>}

      {/* Row status */}
      {!isNewRow && (
        <div style={{ marginBottom: 10, color: '#27ae60', fontWeight: 600, fontSize: 13 }}>
          ✏️ Режим редактирования — запись #{row.id}
        </div>
      )}

      {/* Main form */}
      <div className="card">
        <h2>Данные заказа</h2>

        {/* Datalist elements for autocomplete */}
        <datalist id="dl-names">
          {autocomplete.names.map(n => <option key={n} value={n} />)}
        </datalist>
        <datalist id="dl-phones">
          {autocomplete.phones.map(p => <option key={p} value={p} />)}
        </datalist>

        <div className="form-grid">
          <div className="field">
            <label>ФИО клиента</label>
            <input
              type="text"
              list="dl-names"
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
              list="dl-phones"
              value={row.phone}
              onChange={e => setField('phone', e.target.value)}
              placeholder="+7 (000) 000-00-00"
              disabled={busy}
            />
          </div>
          <div className="field span-2">
            <label>Костюм</label>
            <input
              type="text"
              value={row.costumeName}
              onChange={e => setField('costumeName', e.target.value)}
              placeholder="Название костюма"
              disabled={busy}
            />
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="card">
        <h2>Даты</h2>
        <div className="form-grid cols-3">
          <div className="field">
            <label>Дата заявки</label>
            <input
              type="date"
              value={isoToInput(row.creationDate)}
              onChange={e => setField('creationDate', inputToIso(e.target.value))}
              disabled={busy}
            />
          </div>
          <div className="field">
            <label>Дата выдачи</label>
            <input
              type="date"
              value={isoToInput(row.actualOrderDate)}
              onChange={e => setField('actualOrderDate', inputToIso(e.target.value))}
              disabled={busy}
            />
          </div>
          <div className="field">
            <label>Дата возврата</label>
            <input
              type="date"
              value={isoToInput(row.returnDate)}
              onChange={e => setField('returnDate', inputToIso(e.target.value))}
              disabled={busy}
            />
          </div>
        </div>
      </div>

      {/* Payments */}
      <div className="card">
        <h2>Оплата</h2>
        <div className="form-grid cols-3">
          <div className="field">
            <label>Стоимость (₽)</label>
            <input
              type="text"
              inputMode="numeric"
              value={numDisplay(row.price)}
              onChange={setNumField('price')}
              placeholder="0"
              disabled={busy}
            />
          </div>
          <div className="field">
            <label>Предоплата нал (₽)</label>
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
            <label>Предоплата безнал (₽)</label>
            <input
              type="text"
              inputMode="numeric"
              value={numDisplay(row.prepaymentDigital)}
              onChange={setNumField('prepaymentDigital')}
              placeholder="0"
              disabled={busy}
            />
          </div>

          <div className="field">
            <label>Остаток (долг)</label>
            <div className={`computed-badge ${owe < 0 ? 'negative' : ''}`}>
              {owe} ₽
            </div>
          </div>
          <div className="field">
            <label>Залог нал (₽)</label>
            <input
              type="text"
              inputMode="numeric"
              value={numDisplay(row.pledgeCash)}
              onChange={setNumField('pledgeCash')}
              placeholder="0"
              disabled={busy}
            />
          </div>
          <div className="field">
            <label>Залог безнал (₽)</label>
            <input
              type="text"
              inputMode="numeric"
              value={numDisplay(row.pledgeDigital)}
              onChange={setNumField('pledgeDigital')}
              placeholder="0"
              disabled={busy}
            />
          </div>
        </div>
      </div>

      {/* Comment */}
      <div className="card">
        <h2>Комментарий</h2>
        <div className="form-grid cols-1">
          <div className="field">
            <textarea
              value={row.comment}
              onChange={e => setField('comment', e.target.value)}
              rows={3}
              placeholder="Дополнительные заметки…"
              disabled={busy}
            />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="card">
        <div className="btn-row">
          <button
            className="btn-primary"
            onClick={() => handleSave(false)}
            disabled={busy || !hasFile}
            title={isNewRow ? 'Сохранить запись' : 'Обновить запись'}
          >
            {busy ? '⏳ Сохранение…' : isNewRow ? '💾 Сохранить' : '💾 Обновить'}
          </button>

          <button
            className="btn-success"
            onClick={() => handleSave(true)}
            disabled={busy || !hasFile}
            title="Сохранить и открыть квитанцию для печати"
          >
            {busy ? '⏳…' : '🖨 Сохранить и распечатать'}
          </button>

          <button
            className="btn-secondary"
            onClick={handleReset}
            disabled={busy}
          >
            🔄 Сброс
          </button>
        </div>
      </div>
    </>
  )
}
