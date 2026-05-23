import React, { useState, useEffect } from 'react';
import { CoinDenomination, DispenseTransaction } from './types';
import WalletSimulator from './components/WalletSimulator';
import CoinStats from './components/CoinStats';
import WithdrawalControl from './components/WithdrawalControl';
import { getInventoryWeight } from './utils';
import { 
  PlusCircle, 
  Settings, 
  HelpCircle, 
  Compass, 
  Scale, 
  Coins, 
  Zap, 
  VolumeX, 
  Volume2, 
  Smartphone,
  Shield,
  Coffee,
  ShoppingBag,
  Store,
  Info
} from 'lucide-react';

export default function App() {
  // Coin inventory state (Defaults to some ready coins: 50x8, 10x12, 5x15, 1x22)
  const [inventory, setInventory] = useState<Record<CoinDenomination, number>>({
    50: 8,
    10: 12,
    5: 15,
    1: 22,
  });

  const [sensorMode, setSensorMode] = useState<'separate' | 'combined'>('separate');
  const [tareWeightGrams, setTareWeightGrams] = useState<number>(120); // standard wallet weight is 120 grams
  const [isDispensing, setIsDispensing] = useState<boolean>(false);
  const [dispenseCoinsQueue, setDispenseCoinsQueue] = useState<{ denomination: CoinDenomination; count: number }[]>([]);

  // Transaction state
  const [transactions, setTransactions] = useState<DispenseTransaction[]>([]);

  // State for sound output toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Load from localStorage if available, for pristine offline storage state
  useEffect(() => {
    try {
      const storedInv = localStorage.getItem('wallet_inventory_v1');
      const storedTx = localStorage.getItem('wallet_tx_v1');
      if (storedInv) setInventory(JSON.parse(storedInv));
      if (storedTx) setTransactions(JSON.parse(storedTx));
    } catch (e) {
      console.warn('LocalStorage load blocked or unsupported', e);
    }
  }, []);

  // Save to localStorage whenever state modifies
  useEffect(() => {
    try {
      localStorage.setItem('wallet_inventory_v1', JSON.stringify(inventory));
    } catch (e) {
      console.error(e);
    }
  }, [inventory]);

  useEffect(() => {
    try {
      localStorage.setItem('wallet_tx_v1', JSON.stringify(transactions));
    } catch (e) {
      console.error(e);
    }
  }, [transactions]);

  const addTransaction = (tx: DispenseTransaction) => {
    setTransactions((prev) => [tx, ...prev]);
  };

  const clearTransactions = () => {
    setTransactions([]);
  };

  // Start animated output stream
  const handleDispenseStart = (queue: { denomination: CoinDenomination; count: number }[]) => {
    setIsDispensing(true);
    setDispenseCoinsQueue(queue);
  };

  const handleDispenseDone = () => {
    setIsDispensing(false);
    setDispenseCoinsQueue([]);
  };

  // Calculate current stats for diagnostic cards
  const totalBalance = 
    inventory[50] * 50 + 
    inventory[10] * 10 + 
    inventory[5] * 5 + 
    inventory[1] * 1;

  // Real-time payment diagnostic checker (what can they buy with exact coin sum)
  const canExactMatchItem = (price: number): boolean => {
    // Greedy solver replica
    let remaining = price;
    const denoms: CoinDenomination[] = [50, 10, 5, 1];
    const available = { ...inventory };
    
    for (const d of denoms) {
      const take = Math.min(Math.floor(remaining / d), available[d]);
      remaining -= take * d;
      available[d] -= take;
    }
    return remaining === 0;
  };

  // Diagnostic items to buy
  const shoppingItems = [
    { name: '自動販賣機飲料 (飲料罐)', price: 25, icon: Coffee, desc: '販賣機經典罐裝奶茶咖啡' },
    { name: '超商特大杯拿鐵咖啡', price: 60, icon: Coffee, desc: '醒腦特大杯莊園級美式拿鐵' },
    { name: '排骨便當 / 雞腿飯', price: 115, icon: ShoppingBag, desc: '傳統現炸香脆精選便當' },
    { name: '平價小火鍋 / 涮涮鍋', price: 180, icon: Store, desc: '冬季首選熱騰騰個人小火鍋' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-teal-500 selection:text-slate-900 pb-12">
      
      {/* Header Panel */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 py-3.5 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* Logo & Navigation brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-amber-500 flex items-center justify-center shadow-md shadow-teal-500/10">
              <Coins className="w-5.5 h-5.5 text-slate-950 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-105">
                  零錢分析工具
                </h1>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 font-bold px-2 py-0.5 rounded-full border border-teal-550/20 select-none uppercase">
                  Hardware v2.4
                </span>
              </div>
              <p className="text-xs text-slate-400">
                錢包內置型重量傳感零錢估算、漏斗作動控制與自動配額查詢
              </p>
            </div>
          </div>

          {/* Quick System Indicators */}
          <div className="flex items-center gap-3 sm:self-center">
            {/* UTC real-time clock indicator */}
            <div className="text-[11px] font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-850 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-[pulse_1.5s_infinite]" />
              <span>UTC : 2026-05-23</span>
            </div>

            {/* Audio Toggle button */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1.5 rounded-lg border transition flex items-center gap-1 text-xs font-semibold ${soundEnabled ? 'bg-indigo-950/40 border-indigo-900 text-indigo-400 hover:bg-slate-800' : 'bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-300'}`}
              title={soundEnabled ? "點擊關閉滴答硬幣聲" : "點擊開啓硬幣音效"}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span className="hidden md:inline">音效開</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span className="hidden md:inline">音效關</span>
                </>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* Main Dashboard space */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 flex-1 space-y-6">
        
        {/* Core Dashboard grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          
          {/* Card Left: Interactive Wallet Simulator */}
          <div className="flex flex-col">
            <WalletSimulator
              inventory={inventory}
              setInventory={setInventory}
              sensorMode={sensorMode}
              setSensorMode={setSensorMode}
              tareWeightGrams={tareWeightGrams}
              setTareWeightGrams={setTareWeightGrams}
              isDispensing={isDispensing}
              dispenseCoinsQueue={dispenseCoinsQueue}
              onDispenseDone={handleDispenseDone}
            />
          </div>

          {/* Card Right: Statistical Chart analysis */}
          <div className="flex flex-col">
            <CoinStats
              inventory={inventory}
              sensorMode={sensorMode}
              setInventory={setInventory}
            />
          </div>

        </div>

        {/* Second Row: Single View panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Column 1 & 2: smart billing solver controls */}
          <div className="lg:col-span-2 flex flex-col">
            <WithdrawalControl
              inventory={inventory}
              onDispenseStart={handleDispenseStart}
              isDispensing={isDispensing}
              setInventory={setInventory}
              addTransaction={addTransaction}
              transactions={transactions}
              clearTransactions={clearTransactions}
            />
          </div>

          {/* Column 3: Live diagnostic widget */}
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Compass className="w-4 h-4 text-teal-400" />
                <h3 className="font-bold text-slate-100 text-sm">硬幣購買力診斷 (Payment Diagnostic)</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-tight">
                系統即時解算目前錢包內的零錢組合，是否能夠在不需找零的情況下「精準付清」特定款項：
              </p>

              {/* Shopping Diagnostic Puzzles */}
              <div className="space-y-3">
                {shoppingItems.map((item, index) => {
                  const Icon = item.icon;
                  const affordable = canExactMatchItem(item.price);
                  return (
                    <div 
                      key={index}
                      className={`p-3 rounded-xl border transition ${affordable ? 'bg-emerald-950/10 border-emerald-500/20 hover:border-emerald-500/40' : 'bg-slate-950 border-slate-850 opacity-70'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${affordable ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-900 text-slate-500'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-200 block">{item.name}</span>
                            <span className="text-[10px] text-slate-400 block">{item.desc}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono text-xs font-bold block text-slate-300">
                            ${item.price}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded inline-block mt-1 ${affordable ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/50' : 'bg-slate-900 text-slate-500'}`}>
                            {affordable ? '可剛好付清' : '零錢湊不齊'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Smart saving advice based on wallet composition */}
            <div className="mt-5 pt-4 border-t border-slate-800 text-xs bg-slate-950/40 p-3 rounded-xl border border-slate-850">
              <span className="text-teal-400 font-bold block mb-1 flex items-center gap-1 text-[11px]">
                <Zap className="w-3.5 h-3.5" />
                零錢槽健康智慧建議：
              </span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                {totalBalance === 0 ? (
                  "目前錢包已完全空置，建議向自動櫃員機或找零配裝機提取至少部分 50元與 10元硬幣存入，以便激活日常付款解算機制。"
                ) : totalBalance > 600 ? (
                  "偵測到累計零錢已經較多（超過 NT$600），錢包可能會產生較大物理重量，建議盡快使用漏斗大額提款，或者到超市與悠遊卡加值機將銅板轉儲存。"
                ) : inventory[1] > 15 ? (
                  "您的 1元零錢槽存量較為豐富，建議主動設定 1元尾數提款（例如預設 $35, $88），能更快速釋放零錢槽容積。"
                ) : (
                  "當前零錢槽配比均衡，硬幣總重適中，十分適合隨身攜帶。漏斗控制器已準備妥當，隨時可以使用指定金額輸出。"
                )}
              </p>
            </div>
          </div>

        </div>

      </main>

      <footer className="text-slate-600 text-xs text-center mt-12 py-4 select-none max-w-7xl mx-auto px-4 border-t border-slate-900/60 w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p>零錢分析工具 (Smart Wallet Coin Analyser Panel) · 台灣特製流通銅板校準版</p>
        <p className="font-mono text-[10px]">Security certified & Sandbox isolated</p>
      </footer>

    </div>
  );
}
