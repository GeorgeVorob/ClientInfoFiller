import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs, { type Dayjs } from 'dayjs'
import EditIcon from '@mui/icons-material/Edit'
import SettingsIcon from '@mui/icons-material/Settings'
import type { AppConfig, Row } from '@shared/types'
import { calcOwe, newRow } from '@shared/types'
import SearchPanel from './SearchPanel'

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
  const [autocomplete, setAutocomplete] = useState<{
    names: string[]
    phones: string[]
    nameToPhone: Record<string, string>
  }>({
    names: [],
    phones: [],
    nameToPhone: {},
  })
  const [fileLockedOpen, setFileLockedOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sbpInitialValue, setSbpInitialValue] = useState(config.sbpEnabled)
  const formTopRef = useRef<HTMLDivElement | null>(null)

  const filePath = config.mainExcelFilePath
  const hasFile = Boolean(filePath)
  const isNewRow = row.rowPos === -1
  const sbpEnabled = config.sbpEnabled
  const effectiveRow = sbpEnabled ? row : { ...row, prepaymentSBP: 0, pledgeSBP: 0 }
  const owe = calcOwe(effectiveRow)
  const showSbpWarning = settingsOpen && sbpInitialValue !== sbpEnabled

  const loadAutocomplete = useCallback(async (path: string) => {
    if (!path) return

    try {
      const data = await window.api.getAutocomplete(path, sbpEnabled)
      setAutocomplete(data)
    } catch {
      // Autocomplete is optional; failure should not block editing.
    }
  }, [sbpEnabled])

  useEffect(() => {
    loadAutocomplete(filePath)
  }, [filePath, loadAutocomplete])

  useEffect(() => {
    if (!sbpEnabled && (row.prepaymentSBP !== 0 || row.pledgeSBP !== 0)) {
      setRow(prev => ({ ...prev, prepaymentSBP: 0, pledgeSBP: 0 }))
    }
  }, [sbpEnabled, row.prepaymentSBP, row.pledgeSBP])

  function setField<K extends keyof Row>(key: K, value: Row[K]) {
    setRow(prev => ({ ...prev, [key]: value }))
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setField('customerName', value)
    const phone = autocomplete.nameToPhone[value]
    if (phone && !row.phone) {
      setField('phone', phone)
    }
  }

  function setNumField(
    key: 'price' | 'prepaymentCash' | 'prepaymentDigital' | 'prepaymentSBP' | 'pledgeCash' | 'pledgeDigital' | 'pledgeSBP'
  ) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, '').slice(0, 9)
      setField(key, val === '' ? 0 : parseInt(val, 10))
    }
  }

  function numDisplay(val: number) {
    return val === 0 ? '' : String(val)
  }

  function upsertAutocomplete(saved: Row) {
    setAutocomplete(prev => {
      const names = [...prev.names]
      const phones = [...prev.phones]
      const nameToPhone = { ...prev.nameToPhone }

      if (saved.customerName && !names.some(name => name.toLowerCase() === saved.customerName.toLowerCase())) {
        names.push(saved.customerName)
      }

      if (saved.phone && !phones.includes(saved.phone)) {
        phones.push(saved.phone)
      }

      if (saved.customerName && saved.phone) {
        nameToPhone[saved.customerName] = saved.phone
      }

      return { names, phones, nameToPhone }
    })
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
      const saved = await window.api.saveRow(filePath, effectiveRow, sbpEnabled)
      upsertAutocomplete(saved)
      setRow(saved)
      if (isNewRow || andPrint) {
        await window.api.fillAndPrint(saved)
      }
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

  function handleRowSelect(selected: Row) {
    setRow(selected)
    setError(null)
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleSbpToggle(event: React.ChangeEvent<HTMLInputElement>) {
    await onConfigChange({ sbpEnabled: event.target.checked })
  }

  function openSettings() {
    setSbpInitialValue(config.sbpEnabled)
    setSettingsOpen(true)
  }

  return (
    <Stack spacing={1}>
      <Box ref={formTopRef} />

      <Dialog open={fileLockedOpen} onClose={() => setFileLockedOpen(false)}>
        <DialogTitle>Файл занят</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Не удалось сохранить запись - файл Excel открыт в другой программе.
            <br />
            <br />
            Закройте файл и попробуйте снова.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFileLockedOpen(false)} variant="contained" autoFocus>
            Понятно
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Настройки полей</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Box>
              <FormControlLabel
                control={<Switch checked={sbpEnabled} onChange={handleSbpToggle} />}
                label="СБП"
              />
              <Typography variant="body2" color="text.secondary">
                Включить столбцы для СБП - они будут вставлены в 'J' и 'O' столбцы.
              </Typography>
            </Box>

            <Collapse in={showSbpWarning} timeout="auto" unmountOnExit>
              <Alert severity="warning">
                При переключении СБП в таблице со старыми записями число столбцов изменится и новые записи будут сдвинуты, учтите это в таблице - добавьте столбцы для СБП вручную вдоль всей таблицы или уберите их, со сдвигом соседних.
              </Alert>
            </Collapse>

            <Divider />

            <Stack spacing={1}>
              <Typography variant="subtitle1">
                Текущая схема столбцов в таблице (СБП {sbpEnabled ? '' : 'НЕ '}включен)
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 72 }}>Столбец</TableCell>
                      <TableCell>Поле</TableCell>
                      <TableCell>Шаблон в Word</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow><TableCell>A</TableCell><TableCell>ID</TableCell><TableCell>{'{ID}'}</TableCell></TableRow>
                    <TableRow><TableCell>B</TableCell><TableCell>ФИО</TableCell><TableCell>{'{CustomerName}'}</TableCell></TableRow>
                    <TableRow><TableCell>C</TableCell><TableCell>Костюм</TableCell><TableCell>{'{CostumeName}'}</TableCell></TableRow>
                    <TableRow><TableCell>D</TableCell><TableCell>Телефон</TableCell><TableCell>{'{Phone}'}</TableCell></TableRow>
                    <TableRow><TableCell>E</TableCell><TableCell>Дата заявки</TableCell><TableCell>{'{CreationDate}'}</TableCell></TableRow>
                    <TableRow><TableCell>F</TableCell><TableCell>Дата выдачи</TableCell><TableCell>{'{ActualOrderDate}'}</TableCell></TableRow>
                    <TableRow><TableCell>G</TableCell><TableCell>Дата возврата</TableCell><TableCell>{'{ReturnDate}'}</TableCell></TableRow>
                    <TableRow><TableCell>H</TableCell><TableCell>Стоимость</TableCell><TableCell>{'{Price}'}</TableCell></TableRow>
                    <TableRow>
                      <TableCell>I</TableCell>
                      <TableCell>Предоплата безнал</TableCell>
                      <TableCell rowSpan={sbpEnabled ? 3 : 2}>{'{Prepayment}'}</TableCell>
                    </TableRow>
                    {sbpEnabled ? (
                      <>
                        <TableRow><TableCell>J</TableCell><TableCell>Предоплата СБП</TableCell></TableRow>
                        <TableRow><TableCell>K</TableCell><TableCell>Предоплата нал</TableCell></TableRow>
                        <TableRow><TableCell>L</TableCell><TableCell>Долг</TableCell><TableCell>{'{Owe}'}</TableCell></TableRow>
                        <TableRow><TableCell>M</TableCell><TableCell>Залог нал</TableCell><TableCell rowSpan={3}>{'{Pledge}'}</TableCell></TableRow>
                        <TableRow><TableCell>N</TableCell><TableCell>Залог безнал</TableCell></TableRow>
                        <TableRow><TableCell>O</TableCell><TableCell>Залог СБП</TableCell></TableRow>
                        <TableRow><TableCell>P</TableCell><TableCell>Комментарий</TableCell><TableCell>{'{Comment}'}</TableCell></TableRow>
                      </>
                    ) : (
                      <>
                        <TableRow><TableCell>J</TableCell><TableCell>Предоплата нал</TableCell></TableRow>
                        <TableRow><TableCell>K</TableCell><TableCell>Долг</TableCell><TableCell>{'{Owe}'}</TableCell></TableRow>
                        <TableRow><TableCell>L</TableCell><TableCell>Залог нал</TableCell><TableCell rowSpan={2}>{'{Pledge}'}</TableCell></TableRow>
                        <TableRow><TableCell>M</TableCell><TableCell>Залог безнал</TableCell></TableRow>
                        <TableRow><TableCell>N</TableCell><TableCell>Комментарий</TableCell><TableCell>{'{Comment}'}</TableCell></TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)} variant="contained">
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>

      <Card variant="outlined">
        <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
          <Stack spacing={0}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Файл таблицы заказов</Typography>
              <IconButton size="small" onClick={openSettings} disabled={busy} aria-label="Настройки полей">
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Stack>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
            >
              <Chip
                color="primary"
                variant={hasFile ? 'filled' : 'outlined'}
                label={filePath || 'Файл не выбран'}
                sx={{ justifyContent: 'flex-start', maxWidth: '100%', borderRadius: 1, height: 36 }}
              />
              <Button variant="outlined" onClick={pickFile} disabled={busy}>
                Обзор...
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) minmax(320px, 400px)' },
          gap: 1,
          alignItems: 'start',
        }}
      >
        <Stack spacing={1}>
          <Collapse in={Boolean(error)} timeout="auto" unmountOnExit>
            <Alert severity="error">{`Произошла ошибка:\n${error ?? ''}`}</Alert>
          </Collapse>

          <Collapse in={!isNewRow} timeout="auto" unmountOnExit>
            <Alert severity="success" icon={<EditIcon />}>
              Режим редактирования - запись #{row.id}
            </Alert>
          </Collapse>

          <datalist id="dl-names">
            {autocomplete.names.map(name => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <datalist id="dl-phones">
            {autocomplete.phones.map(phone => (
              <option key={phone} value={phone} />
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
                    {sbpEnabled && (
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
                    )}
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
                    {sbpEnabled && (
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
                    )}
                  </Stack>
                </Box>
                <TextField
                  label="Долг"
                  value={String(owe)}
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
                {!isNewRow && (
                  <Button variant="contained" color="success" onClick={() => handleSave(false)} disabled={busy || !hasFile}>
                    {busy ? 'Сохранение...' : 'Обновить'}
                  </Button>
                )}
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

        <Box sx={{ position: { lg: 'sticky' }, top: 0, alignSelf: 'start' }}>
          <SearchPanel filePath={filePath} sbpEnabled={config.sbpEnabled} onRowSelect={handleRowSelect} />
        </Box>
      </Box>
    </Stack>
  )
}
