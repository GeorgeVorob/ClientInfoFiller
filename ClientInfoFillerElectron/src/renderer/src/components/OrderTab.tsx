import React, { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { AppConfig, Row } from '@shared/types'
import { calcOwe, newRow } from '@shared/types'

interface Props {
  config: AppConfig
  onConfigChange: (p: Partial<AppConfig>) => Promise<AppConfig>
}

function isoToInput(iso: string): string {
  return iso.slice(0, 10)
}

function inputToIso(val: string): string {
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

  const loadAutocomplete = useCallback(async (path: string) => {
    if (!path) return
    try {
      const data = await window.api.getAutocomplete(path)
      setAutocomplete(data)
    } catch {
      // Autocomplete is optional; failure should not block editing.
    }
  }, [])

  useEffect(() => {
    loadAutocomplete(filePath)
  }, [filePath, loadAutocomplete])

  function setField<K extends keyof Row>(key: K, value: Row[K]) {
    setRow((prev: Row) => ({ ...prev, [key]: value }))
  }

  function setNumField(
    key: 'price' | 'prepaymentCash' | 'prepaymentDigital' | 'pledgeCash' | 'pledgeDigital'
  ) {
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
    if (path) {
      await onConfigChange({ mainExcelFilePath: path })
      await loadAutocomplete(path)
    }
  }

  async function handleSave(andPrint = false) {
    if (!filePath) {
      setError('Сначала выберите файл таблицы.')
      return
    }

    setBusy(true)
    setError(null)

    try {
      const saved = await window.api.saveRow(filePath, row)
      if (isNewRow || andPrint) {
        await window.api.fillAndPrint(saved)
      }

      if (isNewRow) {
        setRow(newRow())
        await loadAutocomplete(filePath)
      } else {
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

  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant="h6">Файл таблицы заказов</Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
            >
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

      {!isNewRow && <Alert severity="success">Режим редактирования - запись #{row.id}</Alert>}

      <datalist id="dl-names">
        {autocomplete.names.map(n => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <datalist id="dl-phones">
        {autocomplete.phones.map(p => (
          <option key={p} value={p} />
        ))}
      </datalist>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Данные заказа</Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              }}
            >
              <TextField
                label="ФИО клиента"
                value={row.customerName}
                onChange={e => setField('customerName', e.target.value)}
                placeholder="Иванов Иван Иванович"
                disabled={busy}
                slotProps={{ htmlInput: { list: 'dl-names' } }}
                fullWidth
              />
              <TextField
                label="Номер телефона"
                value={row.phone}
                onChange={e => setField('phone', e.target.value)}
                placeholder="+7 (000) 000-00-00"
                disabled={busy}
                slotProps={{ htmlInput: { list: 'dl-phones' } }}
                fullWidth
              />
              <TextField
                label="Костюм"
                value={row.costumeName}
                onChange={e => setField('costumeName', e.target.value)}
                placeholder="Название костюма"
                disabled={busy}
                fullWidth
                sx={{ gridColumn: { xs: 'auto', md: '1 / -1' } }}
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Даты</Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
              }}
            >
              <TextField
                label="Дата заявки"
                type="date"
                value={isoToInput(row.creationDate)}
                onChange={e => setField('creationDate', inputToIso(e.target.value))}
                disabled={busy}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Дата выдачи"
                type="date"
                value={isoToInput(row.actualOrderDate)}
                onChange={e => setField('actualOrderDate', inputToIso(e.target.value))}
                disabled={busy}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Дата возврата"
                type="date"
                value={isoToInput(row.returnDate)}
                onChange={e => setField('returnDate', inputToIso(e.target.value))}
                disabled={busy}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Оплата</Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
              }}
            >
              <TextField
                label="Стоимость (RUB)"
                value={numDisplay(row.price)}
                onChange={setNumField('price')}
                placeholder="0"
                disabled={busy}
                fullWidth
                slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              />
              <TextField
                label="Предоплата нал (RUB)"
                value={numDisplay(row.prepaymentCash)}
                onChange={setNumField('prepaymentCash')}
                placeholder="0"
                disabled={busy}
                fullWidth
                slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              />
              <TextField
                label="Предоплата безнал (RUB)"
                value={numDisplay(row.prepaymentDigital)}
                onChange={setNumField('prepaymentDigital')}
                placeholder="0"
                disabled={busy}
                fullWidth
                slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              />
              <TextField
                label="Остаток"
                value={`${owe} RUB`}
                fullWidth
                slotProps={{ htmlInput: { readOnly: true } }}
                color={owe < 0 ? 'error' : 'primary'}
              />
              <TextField
                label="Залог нал (RUB)"
                value={numDisplay(row.pledgeCash)}
                onChange={setNumField('pledgeCash')}
                placeholder="0"
                disabled={busy}
                fullWidth
                slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              />
              <TextField
                label="Залог безнал (RUB)"
                value={numDisplay(row.pledgeDigital)}
                onChange={setNumField('pledgeDigital')}
                placeholder="0"
                disabled={busy}
                fullWidth
                slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Комментарий</Typography>
            <TextField
              value={row.comment}
              onChange={e => setField('comment', e.target.value)}
              rows={3}
              placeholder="Дополнительные заметки..."
              disabled={busy}
              multiline
              fullWidth
            />
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="contained"
              onClick={() => handleSave(false)}
              disabled={busy || !hasFile}
            >
              {busy ? 'Сохранение...' : isNewRow ? 'Сохранить' : 'Обновить'}
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => handleSave(true)}
              disabled={busy || !hasFile}
            >
              {busy ? 'Обработка...' : 'Сохранить и распечатать'}
            </Button>
            <Button variant="outlined" onClick={handleReset} disabled={busy}>
              Сброс
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
