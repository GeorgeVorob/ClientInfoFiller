import React, { useEffect, useState } from 'react'
import { Box, CircularProgress, Tab, Tabs, Typography } from '@mui/material'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import OrderTab from './components/OrderTab'
import SellTab from './components/SellTab'
import type { AppConfig } from '@shared/types'

type Tab = 'order' | 'sell'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('order')
  const [config, setConfig] = useState<AppConfig | null>(null)

  useEffect(() => {
    window.api.getConfig().then(setConfig)
  }, [])

  async function updateConfig(partial: Partial<AppConfig>) {
    const next = await window.api.setConfig(partial)
    setConfig(next)
    return next
  }

  if (!config) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
          flexDirection: 'column',
        }}
      >
        <CircularProgress size={28} />
        <Typography variant="body2" color="text.secondary">Загрузка…</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Tabs
          value={activeTab}
          onChange={(_e, value: Tab) => setActiveTab(value)}
          variant="fullWidth"
          sx={{ minHeight: 32, height: 32 }}
          TabIndicatorProps={{ style: { height: 2 } }}
        >
          <Tab
            icon={<ReceiptLongIcon fontSize="small" />}
            iconPosition="start"
            label={<span style={{ fontSize: 13, fontWeight: 500 }}>Оформление заказа</span>}
            value="order"
            sx={{ minHeight: 32, height: 32, py: 0, px: 1.5 }}
          />
          <Tab
            icon={<PointOfSaleIcon fontSize="small" />}
            iconPosition="start"
            label={<span style={{ fontSize: 13, fontWeight: 500 }}>Продажа</span>}
            value="sell"
            sx={{ minHeight: 32, height: 32, py: 0, px: 1.5 }}
          />
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 1.5, md: 1 } }}>
        {activeTab === 'order' && (
          <OrderTab config={config} onConfigChange={updateConfig} />
        )}
        {activeTab === 'sell' && (
          <SellTab config={config} onConfigChange={updateConfig} />
        )}
      </Box>
    </Box>
  )
}

// Augment window so TypeScript knows about the preload bridge
declare global {
  interface Window {
    api: {
      openExcelFile(): Promise<string | null>
      getConfig(): Promise<AppConfig>
      setConfig(p: Partial<AppConfig>): Promise<AppConfig>
      saveRow(path: string, row: import('@shared/types').Row): Promise<import('@shared/types').Row>
      saveSellRow(path: string, row: import('@shared/types').Row): Promise<import('@shared/types').Row>
      getAutocomplete(path: string): Promise<{ names: string[]; phones: string[] }>
      fillAndPrint(row: import('@shared/types').Row): Promise<void>
    }
  }
}
