import React, { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs, { type Dayjs } from 'dayjs'
import type { AppConfig, Row } from '@shared/types'
import { calcOwe, newRow } from '@shared/types'

interface Props {
  config: AppConfig
  onConfigChange: (p: Partial<AppConfig>) => Promise<AppConfig>
}

function isoToDayjs(iso: string): Dayjs {
  const d = dayjs(iso)
  return d.isValid() ? d : dayjs()
}

function dayjsToIso(d: Dayjs | null): string {
  return d && d.isValid() ? d.startOf('day').toISOString() : dayjs().startOf('day').toISOString()
}

export default function OrderTab({ config, onConfigChange }: Props) {
  const [row, setRow] = useState<Row>(newRow())
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [autocomplete, setAutocomplete] = useState<{ names: string[]; phones: string[]; nameToPhone: Record<string, string> }>({
    names: [],
    phones: [],
    nameToPhone: {},
  })
  const [fileLockedOpen, setFileLockedOpen] = useState(false)

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
  // При выборе имени через автокомплит — если телефон пустой, подставляем его
  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setField('customerName', value)
    const phone = autocomplete.nameToPhone[value]
    if (phone && !row.phone) {
      setField('phone', phone)
    }
  }

  useEffect(() => {
    loadAutocomplete(filePath)
  }, [filePath, loadAutocomplete])

  function setField<K extends keyof Row>(key: K, value: Row[K]) {
    setRow((prev: Row) => ({ ...prev, [key]: value }))
  }

  function setNumField(
    key: 'price' | 'prepaymentCash' | 'prepaymentDigital' | 'prepaymentSBP' | 'pledgeCash' | 'pledgeDigital' | 'pledgeSBP'
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
      console.log('Is new row?', isNewRow, 'Saved row:', saved)
      if (isNewRow || andPrint) {
        await window.api.fillAndPrint(saved)
      }

      setRow(saved)

      // if (isNewRow) {
      //   setRow(newRow())
      //   await loadAutocomplete(filePath)
      // } else {
      //   setRow(saved)
      // }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('FILE_LOCKED')) {
        setFileLockedOpen(true)
      } else {
        setError(msg)
      }
    } finally {
      setBusy(false)
    }
  }

  function handleReset() {
    setRow(newRow())
    setError(null)
  }

  return (
    <Stack spacing={0}>
            <Dialog open={fileLockedOpen} onClose={() => setFileLockedOpen(false)}>
              <DialogTitle>Файл занят</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  Не удалось сохранить запись — файл Excel открыт в другой программе.
                  <br /><br />
                  Закройте файл и попробуйте снова.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setFileLockedOpen(false)} variant="contained" autoFocus>
                  Понятно
                </Button>
              </DialogActions>
            </Dialog>
      <Card variant="outlined">
        <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
          <Stack spacing={0}>
            <Typography variant="h6">Файл таблицы заказов</Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
            >
              <Chip
                color={'primary'}
                variant={hasFile ? 'filled' : 'outlined'}
                label={filePath || 'Файл не выбран'}
                sx={{
                  justifyContent: 'flex-start',
                  maxWidth: '100%',
                  borderRadius: 1,
                  height: 36,
                }}
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
        <CardContent sx={{ py: 1, '&:last-child': { p: 1 } }}>
            <Stack spacing={0.5}>
              <TextField
                label="ФИО клиента"
                value={row.customerName}
                onChange={handleNameChange}
                placeholder="Иванов Иван Иванович"
                disabled={busy}
                slotProps={{ htmlInput: { list: 'dl-names' } }}
                size="small"
                fullWidth
              />
              <TextField
                label="Номер телефона"
                value={row.phone}
                onChange={e => setField('phone', e.target.value)}
                placeholder="+7 (000) 000-00-00"
                disabled={busy}
                slotProps={{ htmlInput: { list: 'dl-phones' } }}
                size="small"
                fullWidth
              />
              <TextField
                label="Костюм"
                value={row.costumeName}
                onChange={e => setField('costumeName', e.target.value)}
                placeholder="Название костюма"
                disabled={busy}
                size="small"
                fullWidth
              />
            </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent sx={{ py: 1, '&:last-child': { p: 1 } }}>
          <Stack spacing={0.5}>
            <DatePicker
              label="Дата заявки"
              value={isoToDayjs(row.creationDate)}
              onChange={d => setField('creationDate', dayjsToIso(d))}
              disabled={busy}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
            <DatePicker
              label="Дата выдачи"
              value={isoToDayjs(row.actualOrderDate)}
              onChange={d => setField('actualOrderDate', dayjsToIso(d))}
              disabled={busy}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
            <DatePicker
              label="Дата возврата"
              value={isoToDayjs(row.returnDate)}
              onChange={d => setField('returnDate', dayjsToIso(d))}
              disabled={busy}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent sx={{ py: 1, '&:last-child': { p: 1 } }}>
          <Stack spacing={0.5}>
            <TextField
              label="Стоимость"
              value={numDisplay(row.price)}
              onChange={setNumField('price')}
              placeholder="0"
              disabled={busy}
              size="small"
              fullWidth
              slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
              <Stack spacing={0.5}>
                <TextField
                  label="Предоплата нал"
                  value={numDisplay(row.prepaymentCash)}
                  onChange={setNumField('prepaymentCash')}
                  placeholder="0"
                  disabled={busy}
                  size="small"
                  fullWidth
                  slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                />
                <TextField
                  label="Предоплата безнал"
                  value={numDisplay(row.prepaymentDigital)}
                  onChange={setNumField('prepaymentDigital')}
                  placeholder="0"
                  disabled={busy}
                  size="small"
                  fullWidth
                  slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                />
                <TextField
                  label="Предоплата СБП"
                  value={numDisplay(row.prepaymentSBP)}
                  onChange={setNumField('prepaymentSBP')}
                  placeholder="0"
                  disabled={busy}
                  size="small"
                  fullWidth
                  slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                />
              </Stack>
              <Stack spacing={0.5}>
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
              </Stack>
            </Box>
            <TextField
              label="Долг"
              value={`${owe}`}
              size="small"
              fullWidth
              slotProps={{ htmlInput: { readOnly: true } }}
              color={owe < 0 ? 'error' : 'primary'}
              sx={{ mt: 1 }}
            />
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent sx={{ py: 1, '&:last-child': { p: 1 } }}>
          <Stack spacing={0}>
            <TextField
              value={row.comment}
              onChange={e => setField('comment', e.target.value)}
              rows={3}
              placeholder="Комментарий"
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
            {!isNewRow && <Button
              variant="contained"
              color="success"
              onClick={() => handleSave(false)}
              disabled={busy || !hasFile}
            >
              {busy ? 'Сохранение...' : 'Обновить'}
            </Button>}
            <Button
              variant="contained"
              color={isNewRow ? 'primary' : 'success'}
              onClick={() => handleSave(true)}
              disabled={busy || !hasFile}
            >
              {busy ? 'Обработка...' : isNewRow ? 'Сохранить и распечатать' : 'Обновить и распечатать'}
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
