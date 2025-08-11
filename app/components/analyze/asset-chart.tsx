
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Calendar, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  Tooltip
} from 'recharts'
import { safeFormatTime, safeToDate } from '@/lib/utils'

interface AssetChartProps {
  symbol: string
  priceHistory: Array<{ timestamp: Date; price: number }>
  currentPrice: number
}

export function AssetChart({ symbol, priceHistory, currentPrice }: AssetChartProps) {
  const [timeframe, setTimeframe] = useState('1D')

  const formatChartData = () => {
    return priceHistory?.map(point => {
      const safeDate = safeToDate(point.timestamp)
      return {
        time: safeFormatTime(point.timestamp, { 
          hour: '2-digit', 
          minute: '2-digit' 
        }, '--:--'),
        price: point.price || 0,
        timestamp: safeDate ? safeDate.getTime() : Date.now()
      }
    }).filter(point => point.time !== '--:--') || []
  }

  const chartData = formatChartData()
  const isPositiveChange = chartData.length > 1 && 
    chartData[chartData.length - 1].price > chartData[0].price

  return (
    <Card className="border-muted bg-card/50 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-primary" />
          {symbol} Price Chart
        </CardTitle>
        <div className="flex space-x-1">
          {['1D', '1W', '1M'].map((period) => (
            <Button
              key={period}
              variant={timeframe === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe(period)}
            >
              {period}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <XAxis 
                  dataKey="time" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={['dataMin - 1', 'dataMax + 1']}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="text-sm text-muted-foreground">{label}</p>
                          <p className="text-sm font-semibold">
                            ${typeof payload[0].value === 'number' ? payload[0].value.toFixed(2) : payload[0].value}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={isPositiveChange ? "#22c55e" : "#ef4444"}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chart data loading...</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
