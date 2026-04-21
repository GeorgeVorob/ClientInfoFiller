import React, { useState } from 'react'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
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

  function setNumField(key: 'prepaymentCash' | 'prepaymentDigital' | 'prepaymentSBP' | 'pledgeCash' | 'pledgeDigital' | 'pledgeSBP') {
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
    if (!filePath) {
      setError('Сначала выберите файл таблицы продаж.')
      return
    }
    if (!row.customerName.trim()) {
      setError('Укажите ФИО клиента.')
      return
    }

    setBusy(true)
    setError(null)
    setLastSaved(null)

    try {
      const saved = await window.api.saveSellRow(filePath, row)
      setLastSaved(`Сохранено - запись #${saved.id}`)
      setRow(newRow())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant="h6">Файл таблицы продаж</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Chip
                color={hasFile ? 'success' : 'default'}
                variant={hasFile ? 'filled' : 'outlined'}
                label={filePath || 'Файл не выбран'}
                sx={{ justifyContent: 'flex-start', maxWidth: '100%' }}
              />
              <Button variant="outlined" onClick={pickFile} disabled={busy}>
                Обзор...
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error">{error}</Alert>}
      {lastSaved && <Alert severity="success">{lastSaved}</Alert>}

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Данные о продаже</Typography>
            <Stack spacing={1.5}>
              <TextField
                label="ФИО клиента"
                value={row.customerName}
                onChange={e => setField('customerName', e.target.value)}
                placeholder="Иванов Иван Иванович"
                disabled={busy}
                size="small"
                fullWidth
              />
              <TextField
                label="Номер телефона"
                value={row.phone}
                onChange={e => setField('phone', e.target.value)}
                placeholder="+7 (000) 000-00-00"
                disabled={busy}
                size="small"
                fullWidth
              />
              <TextField
                label="Наименование товара"
                value={row.costumeName}
                onChange={e => setField('costumeName', e.target.value)}
                placeholder="Название"
                disabled={busy}
                size="small"
                fullWidth
              />
              <TextField
                label="Оплата нал"
                value={numDisplay(row.prepaymentCash)}
                onChange={setNumField('prepaymentCash')}
                placeholder="0"
                disabled={busy}
                size="small"
                fullWidth
                slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              />
              <TextField
                label="Оплата безнал"
                value={numDisplay(row.prepaymentDigital)}
                onChange={setNumField('prepaymentDigital')}
                placeholder="0"
                disabled={busy}
                size="small"
                fullWidth
                slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              />
              <TextField
                label="Оплата СБП"
                value={numDisplay(row.prepaymentSBP)}
                onChange={setNumField('prepaymentSBP')}
                placeholder="0"
                disabled={busy}
                size="small"
                fullWidth
                slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              />
              <TextField
                label="Залог нал"
                value={numDisplay(row.pledgeCash)}
                onChange={setNumField('pledgeCash')}
                placeholder="0"
                disabled={busy}
                size="small"
                fullWidth
                slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              />
              <TextField
                label="Залог безнал"
                value={numDisplay(row.pledgeDigital)}
                onChange={setNumField('pledgeDigital')}
                placeholder="0"
                disabled={busy}
                size="small"
                fullWidth
                slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              />
              <TextField
                label="Залог СБП"
                value={numDisplay(row.pledgeSBP)}
                onChange={setNumField('pledgeSBP')}
                placeholder="0"
                disabled={busy}
                size="small"
                fullWidth
                slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              />
              <TextField
                label="Комментарий"
                value={row.comment}
                onChange={e => setField('comment', e.target.value)}
                rows={2}
                placeholder="Дополнительные заметки..."
                disabled={busy}
                multiline
                fullWidth
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="contained"
              color="success"
              onClick={handleSell}
              disabled={busy || !hasFile}
            >
              {busy ? 'Сохранение...' : 'Записать продажу'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setRow(newRow())
                setError(null)
                setLastSaved(null)
              }}
              disabled={busy}
            >
              Сброс
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
