import { useEffect, useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import client from '../api/client'

export default function ChartPanel({ url, height = 420, loading: externalLoading }) {
  const { theme } = useTheme()
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    if (!url) {
      setHtml('')
      return
    }
    
    setLoading(true)
    const fullUrl = `${url}${url.includes('?') ? '&' : '?'}theme=${theme}&t=${Date.now()}`
    
    client.get(fullUrl, { responseType: 'text' })
      .then(res => {
        setHtml(res.data)
      })
      .catch((err) => {
        setHtml(`
          <div style="height: 100vh; display: flex; align-items: center; justify-content: center; font-family: Inter, sans-serif; color: #9ca3af; text-align: center;">
            <p>Error loading chart data.<br/><span style="font-size: 12px; opacity: 0.7;">Make sure you are logged in.</span></p>
          </div>
        `)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [url, theme])

  const isLoading = externalLoading || loading

  if (isLoading) {
    return (
      <div
        className="w-full rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center"
        style={{ height }}
      >
        <div className="spinner flex gap-1">
           <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
           <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
           <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    )
  }

  if (!url || (!html && !isLoading)) {
    return (
      <div
        className="w-full rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
        style={{ height }}
      >
        <p className="text-gray-400 text-sm">No chart data accessible</p>
      </div>
    )
  }

  return (
    <iframe
      srcDoc={html}
      className="chart-frame rounded-2xl bg-transparent"
      style={{ height, width: '100%', border: 'none' }}
      title="Analytics Chart"
      sandbox="allow-scripts allow-popups allow-same-origin"
    />
  )
}
