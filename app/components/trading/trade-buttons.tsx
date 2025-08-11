
'use client'

import { Button } from '@/components/ui/button'
import { ShoppingCart, TrendingDown } from 'lucide-react'

interface TradeButtonsProps {
  symbol: string
  price: number
  handleTrade: (type: 'buy' | 'sell', symbol: string) => void
}

export function TradeButtons({ symbol, price, handleTrade }: TradeButtonsProps) {
  return (
    <div className="flex space-x-3">
      <Button
        onClick={() => handleTrade('buy', symbol)}
        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        Buy {symbol}
      </Button>
      <Button
        onClick={() => handleTrade('sell', symbol)}
        variant="destructive"
        className="flex-1"
      >
        <TrendingDown className="h-4 w-4 mr-2" />
        Sell {symbol}
      </Button>
    </div>
  )
}
