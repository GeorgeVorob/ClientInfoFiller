import React, { useState } from 'react'
import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import type { Row, SearchMode } from '@shared/types'

interface Props {
  filePath: string
  sbpEnabled: boolean
  onRowSelect: (row: Row) => void
}

type Status = 'idle' | 'loading' | 'results' | 'empty' | 'error'

const SEARCH_MODES: { value: SearchMode; label: string }[] = [
  { value: 'byName', label: 'По ФИО' },
  { value: 'byPhone', label: 'По телефону' },
  { value: 'byCostume', label: 'По костюму' },
  { value: 'byId', label: 'По номеру записи' },
]

function formatRowPrimary(row: Row): string {
  return `#${row.id} · ${row.customerName || '—'}`
}

function formatRowSecondary(row: Row): React.ReactNode {
  const d = (iso: string) => new Date(iso).toLocaleDateString('ru-RU')
  return (
    <Stack component="span" spacing={0} sx={{ mt: 0.3 }}>
      <span>Костюм: {row.costumeName || '—'}</span>
      <span>Телефон: {row.phone || '—'}</span>
      <span>Даты: Заявка: {d(row.creationDate)} · Выдача: {d(row.actualOrderDate)} · Возврат: {d(row.returnDate)}</span>
      <span>Цена: {row.price} ₽ · Долг: {row.price - row.prepaymentCash - row.prepaymentDigital - row.prepaymentSBP} ₽</span>
    </Stack>
  )
}

export default function SearchPanel({ filePath, sbpEnabled, onRowSelect }: Props) {
  const [mode, setMode] = useState<SearchMode>('byName')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [results, setResults] = useState<Row[]>([])
  const [error, setError] = useState<string | null>(null)

  async function handleSearch() {
    if (!filePath) return

    setStatus('loading')
    setError(null)

    try {
      const rows = await window.api.searchRows(filePath, { mode, query, limit: 20 }, sbpEnabled)
      setResults(rows)
      setStatus(rows.length > 0 ? 'results' : 'empty')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      setStatus('error')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch()
  }

  function handleSelect(row: Row) {
    onRowSelect(row)
    // setResults([])
    // setStatus('idle')
    // setQuery('')
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
        <Stack spacing={1}>
          <Typography variant="h6">Поиск и изменение записи</Typography>

          <Stack direction={'column'} spacing={1}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Режим поиска</InputLabel>
              <Select
                value={mode}
                label="Режим поиска"
                onChange={e => setMode(e.target.value as SearchMode)}
                disabled={status === 'loading'}
              >
                {SEARCH_MODES.map(item => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              placeholder="Поисковый запрос..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={status === 'loading' || !filePath}
              sx={{ flex: 1 }}
            />

            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={status === 'loading' || !filePath}
              startIcon={status === 'loading' ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
            >
              Найти
            </Button>
          </Stack>

          {!filePath && <Alert severity="warning">Сначала выберите файл таблицы</Alert>}

          {status === 'error' && <Alert severity="error">{error}</Alert>}

          {status === 'empty' && <Alert severity="info">Ничего не найдено</Alert>}

          {status === 'results' && (
            <>
              <Divider />
              <Typography variant="caption" color="text.secondary">
                Найдено: {results.length}
                {results.length === 20 ? ' (показаны первые 20)' : ''}
              </Typography>
              <List dense disablePadding>
                {results.map(row => (
                  <ListItemButton
                    key={row.rowPos}
                    onClick={() => handleSelect(row)}
                    sx={{ borderRadius: 1, alignItems: 'flex-start', '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <ListItemText
                      primary={formatRowPrimary(row)}
                      secondary={formatRowSecondary(row)}
                      slotProps={{
                        primary: { variant: 'body2' },
                        secondary: { component: 'div' },
                      }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
