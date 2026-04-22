import { useTheme } from '../context/ThemeContext'

export default function ChartPanel({ url, height = 420, loading }) {
  const { theme } = useTheme()
  const fullUrl = url ? `${url}${url.includes('?') ? '&' : '?'}theme=${theme}&t=${Date.now()}` : null

  if (loading) {
    return (
      <div
        className="w-full rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center"
        style={{ height }}
      >
        <div className="spinner" />
      </div>
    )
  }

  if (!fullUrl) {
    return (
      <div
        className="w-full rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
        style={{ height }}
      >
        <p className="text-gray-400 text-sm">No chart data</p>
      </div>
    )
  }

  return (
    <iframe
      src={fullUrl}
      className="chart-frame rounded-2xl"
      style={{ height, width: '100%', border: 'none' }}
      title="Analytics Chart"
    />
  )
}
