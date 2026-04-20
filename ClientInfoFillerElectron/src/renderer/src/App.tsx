import React, { useEffect, useState } from 'react'
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

  if (!config) return <div style={{ padding: 20 }}>Загрузка…</div>

  return (
    <div className="app">
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === 'order' ? 'active' : ''}`}
          onClick={() => setActiveTab('order')}
        >
          📋 Оформление заказа
        </button>
        <button
          className={`tab-btn ${activeTab === 'sell' ? 'active' : ''}`}
          onClick={() => setActiveTab('sell')}
        >
          🛍 Продажа
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'order' && (
          <OrderTab config={config} onConfigChange={updateConfig} />
        )}
        {activeTab === 'sell' && (
          <SellTab config={config} onConfigChange={updateConfig} />
        )}
      </div>
    </div>
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
