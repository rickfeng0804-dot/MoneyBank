import React, { useState, useEffect, useRef } from 'react';
import { CoinDenomination, COIN_SPECS } from '../types';
import { getInventoryWeight, playCoinSound } from '../utils';
import { 
  Scale, 
  Settings2, 
  HelpCircle, 
  ShieldAlert, 
  Binary, 
  Compass, 
  ArrowDownToLine, 
  RefreshCw,
  Plus, 
  Minus,
  MoveDown
} from 'lucide-react';

interface WalletSimulatorProps {
  inventory: Record<CoinDenomination, number>;
  setInventory: React.Dispatch<React.SetStateAction<Record<CoinDenomination, number>>>;
  sensorMode: 'separate' | 'combined';
  setSensorMode: (mode: 'separate' | 'combined') => void;
  tareWeightGrams: number;
  setTareWeightGrams: (weight: number) => void;
  isDispensing: boolean;
  dispenseCoinsQueue: { denomination: CoinDenomination; count: number }[];
  onDispenseDone: () => void;
}

interface FallingCoin {
  id: string;
  denom: CoinDenomination;
  offsetX: number; // initial random drift
  delayMs: number;
}

export default function WalletSimulator({
  inventory,
  setInventory,
  sensorMode,
  setSensorMode,
  tareWeightGrams,
  setTareWeightGrams,
  isDispensing,
  dispenseCoinsQueue,
  onDispenseDone,
}: WalletSimulatorProps) {
  const [activeCoinsFalling, setActiveCoinsFalling] = useState<FallingCoin[]>([]);
  const [displayedTrayCoins, setDisplayedTrayCoins] = useState<CoinDenomination[]>([]);
  const [funnelOpen, setFunnelOpen] = useState(false);
  const [vibrateWallet, setVibrateWallet] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Calculate weights
  const coinsWeight = getInventoryWeight(inventory);
  const totalWeight = coinsWeight + tareWeightGrams;

  // Sound triggering and animation loop for dispensing queue
  useEffect(() => {
    if (isDispensing && dispenseCoinsQueue.length > 0) {
      setFunnelOpen(true);
      setVibrateWallet(true);

      // Create sequence of coins falling
      const tempFalling: FallingCoin[] = [];
      let accumulatedDelay = 0;
      const trayCoinsAccumulator: CoinDenomination[] = [];

      dispenseCoinsQueue.forEach(({ denomination, count }) => {
        for (let i = 0; i < count; i++) {
          const id = `${denomination}-${i}-${Math.random()}`;
          tempFalling.push({
            id,
            denom: denomination,
            offsetX: Math.random() * 40 - 20, // random wiggle in funnel
            delayMs: accumulatedDelay,
          });
          trayCoinsAccumulator.push(denomination);
          accumulatedDelay += 280; // Delay between consecutive coins
        }
      });

      setActiveCoinsFalling(tempFalling);

      // Trigger actual animations and audio clinks at delayed checkpoints
      const timers: NodeJS.Timeout[] = [];
      
      tempFalling.forEach((fc) => {
        const timer = setTimeout(() => {
          // Play physical sound
          const freqMultiplier = fc.denom === 50 ? 0.75 : fc.denom === 10 ? 1.0 : fc.denom === 5 ? 1.2 : 1.4;
          playCoinSound(freqMultiplier);
          
          // Add coin to visible bottom dispenser tray
          setDisplayedTrayCoins((prev) => [...prev, fc.denom].slice(-30)); // Limit to last 30 for DOM performance

          // Check if this was the last coin
          if (fc.id === tempFalling[tempFalling.length - 1].id) {
            setTimeout(() => {
              setFunnelOpen(false);
              setVibrateWallet(false);
              onDispenseDone();
              // clear falling pool after exit animation finishes
              setActiveCoinsFalling([]);
            }, 600);
          }
        }, fc.delayMs);
        
        timers.push(timer);
      });

      return () => {
        timers.forEach(clearTimeout);
      };
    }
  }, [isDispensing, dispenseCoinsQueue]);

  // Adjust coin levels manually (to simulate depositing or sorting)
  const adjustInventory = (denom: CoinDenomination, amount: number) => {
    setInventory((prev) => {
      const current = prev[denom];
      const nextValue = Math.max(0, Math.min(45, current + amount)); // Cap inside channel depth
      return {
        ...prev,
        [denom]: nextValue,
      };
    });
    // Synthesis sound for deposit
    if (amount > 0) {
      playCoinSound(denom === 50 ? 0.8 : denom === 10 ? 1.1 : denom === 5 ? 1.3 : 1.5);
    }
  };

  const clearTray = () => {
    setDisplayedTrayCoins([]);
    playCoinSound(1.5);
  };

  return (
    <div id="wallet-simulator" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
      {/* Premium accent line on top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
      
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            錢包內部模擬器 <span className="text-xs font-normal text-slate-400 font-sans">Smart Wallet Hardware</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            物理感測與重量漏斗輸出模組 (模擬高精度 TWD 傳感晶片)
          </p>
        </div>
        
        <button 
          onClick={() => setShowExplanation(!showExplanation)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title="說明感測原理"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {showExplanation && (
        <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 mb-5 text-xs text-slate-700 leading-relaxed transition-all">
          <p className="font-semibold text-blue-800 mb-1 flex items-center gap-1">💡 錢包重量傳感分析原理：</p>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            <li><strong>獨立零錢槽感測</strong>：每個硬幣管道底部有微型單件稱重晶片，獨立得出該管道重量並精準算出硬幣數量。算式：硬幣數量 = 讀值 / 該硬幣標準克數。</li>
            <li><strong>混合單一感測</strong>：將所有硬幣放在底部同一個總重承重板上。系統使用「重量匹配逆運算模型」從總重量反推最符合的多種硬幣數量組合。</li>
            <li><strong>扣除皮重 (Tare)</strong>：模擬扣除皮包本體重量（預設 120g），確保分析出來的數據為純硬幣重量。</li>
          </ul>
        </div>
      )}

      {/* Hardware Container */}
      <div className={`border border-slate-200 bg-slate-50 rounded-xl p-4 relative ${vibrateWallet ? 'animate-[bounce_0.2s_infinite]' : ''}`}>
        
        {/* Hardware Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-mono font-semibold flex items-center gap-1 shadow-xs">
              <Scale className="w-3.5 h-3.5 text-blue-600" />
              <span>總重: {totalWeight.toFixed(1)}g</span>
            </span>
            <span className="text-slate-500 font-medium font-mono text-[11px]">
              (硬幣: {coinsWeight.toFixed(1)}g + 皮重: {tareWeightGrams}g)
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-500 mr-1 font-medium font-sans">感測模式:</span>
            <button
              onClick={() => {
                setSensorMode('separate');
                playCoinSound(1.2);
              }}
              className={`px-2 py-1 text-xs rounded-lg transition-colors font-semibold cursor-pointer ${sensorMode === 'separate' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
            >
              獨立槽
            </button>
            <button
              onClick={() => {
                setSensorMode('combined');
                playCoinSound(0.9);
              }}
              className={`px-2 py-1 text-xs rounded-lg transition-colors font-semibold cursor-pointer ${sensorMode === 'combined' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
            >
              混合
            </button>
          </div>
        </div>

        {/* 4 Slots Inside the Wallet */}
        <div className="grid grid-cols-4 gap-2 h-64 border-b border-slate-200 pb-3 relative">
          
          {(Object.keys(COIN_SPECS) as unknown as CoinDenomination[]).map((denomStr) => {
            const denom = Number(denomStr) as CoinDenomination;
            const spec = COIN_SPECS[denom];
            const count = inventory[denom];
            
            // Generate array for rendered coins
            const displayCoinsLimit = 15; // Max coins rendered on screen to prevent massive lags
            const shadowCoins = Array.from({ length: Math.min(count, displayCoinsLimit) });

            return (
              <div 
                key={denom} 
                className="flex flex-col items-center h-full relative group border-r border-slate-200 last:border-0 pr-1 last:pr-0"
              >
                {/* Coin Track Tube background */}
                <div className="w-full flex-1 bg-white rounded-lg relative overflow-hidden flex flex-col justify-end p-1.5 border border-slate-200 shadow-inner">
                  
                  {/* Subtle limit marker */}
                  <div className="absolute top-2 left-0 right-0 border-t border-slate-200 border-dashed text-[9px] text-slate-400 text-center select-none font-medium">
                    滿載 {displayCoinsLimit}+
                  </div>

                  {/* Coin Stacks rendering */}
                  <div className="relative w-full flex flex-col-reverse items-center justify-end">
                    {shadowCoins.map((_, idx) => {
                      // Stacking effect offset
                      const offsetBottom = idx * 6; // px displacement
                      return (
                        <div
                          key={idx}
                          className="absolute w-11/12 rounded-full cursor-pointer border shadow transition-all duration-300 flex items-center justify-center font-bold font-mono text-[9px] hover:brightness-110 active:scale-95"
                          style={{
                            background: spec.radialGradient,
                            borderColor: spec.borderColor,
                            color: spec.textColor,
                            height: '18px',
                            bottom: `${offsetBottom}px`,
                            transform: `rotate(${idx % 2 === 0 ? '-1.5deg' : '1.5deg'})`,
                            boxShadow: `0 2px 2px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.4)`
                          }}
                          onClick={() => adjustInventory(denom, -1)}
                          title="點擊取出此硬幣"
                        >
                          ${denom}
                        </div>
                      );
                    })}

                    {count === 0 && (
                      <div className="text-[10px] text-slate-400 font-mono text-center mb-8 py-2 w-full select-none">
                        EMPTY
                      </div>
                    )}
                  </div>
                </div>

                {/* Individual slot sensors / labels */}
                <div className="mt-2 w-full text-center flex flex-col items-center">
                  <span className="text-[11px] font-bold text-slate-700 font-sans">{spec.label}</span>
                  
                  {/* Calibration Weight readouts */}
                  {sensorMode === 'separate' ? (
                    <span className="text-[9px] font-mono font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 mt-1 select-none shadow-xs">
                      {(count * spec.weightGrams).toFixed(1)}g
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-slate-400 mt-1 font-medium">
                      混合盤
                    </span>
                  )}

                  {/* Interactive Adjustment buttons */}
                  <div className="flex items-center gap-1 mt-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => adjustInventory(denom, -1)}
                      disabled={count === 0}
                      className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-150 text-slate-500 hover:text-slate-850 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-xs"
                      title="取出 1 枚硬幣"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-mono font-bold text-slate-700 w-5 text-center">
                      {count}
                    </span>
                    <button
                      onClick={() => adjustInventory(denom, 1)}
                      className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-150 text-slate-500 hover:text-slate-850 cursor-pointer transition-colors shadow-xs"
                      title="存入 1 枚硬幣"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* The bottom funnel and sliding gate */}
        <div className="relative pt-2 pb-10 flex justify-center bg-slate-50">
          
          {/* Funnel SVG lines */}
          <div className="w-48 h-12 relative flex items-center justify-center">
            <svg className="w-full h-full text-slate-350 stroke-2 fill-none" viewBox="0 0 200 50">
              {/* Funnel Left wall */}
              <path d="M 10 5 L 85 45" stroke="currentColor" />
              {/* Funnel Right wall */}
              <path d="M 190 5 L 115 45" stroke="currentColor" />
              {/* Center drop tube */}
              <line x1="85" y1="45" x2="85" y2="50" stroke="currentColor" strokeDasharray="2,2" />
              <line x1="115" y1="45" x2="115" y2="50" stroke="currentColor" strokeDasharray="2,2" />
            </svg>

            {/* Slider gate mechanical door */}
            <div 
              className={`absolute top-10 h-1.5 bg-rose-500 border border-rose-400 transition-all duration-300 rounded shadow-md`}
              style={{
                width: '32px',
                left: funnelOpen ? '118px' : '84px', // slides open / closed
              }}
              title={funnelOpen ? "漏斗閘門開啓中" : "漏斗閘門關閉中"}
            />
          </div>

          <div className="absolute top-[40px] text-[9px] font-mono select-none px-1.5 py-0.5 rounded bg-white text-rose-600 border border-rose-100 font-bold shadow-xs">
            {funnelOpen ? "GATE OPEN" : "LOCKED"}
          </div>

          {/* Falling Coins layer */}
          {activeCoinsFalling.map((fc, index) => {
            const spec = COIN_SPECS[fc.denom];
            return (
              <div
                key={fc.id}
                className="absolute z-40 rounded-full border border-black/30 shadow flex items-center justify-center text-[8px] font-extrabold animate-[coinFall_0.5s_ease-out_forwards]"
                style={{
                  background: spec.radialGradient,
                  color: spec.textColor,
                  width: `${spec.diameterMm / 1.1}px`,
                  height: `${spec.diameterMm / 1.1}px`,
                  left: `calc(50% + ${fc.offsetX}px)`,
                  top: '10px',
                  transform: `translateX(-50%)`,
                  lineHeight: 'tight',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                }}
              >
                ${fc.denom}
              </div>
            );
          })}
        </div>
      </div>

      {/* Physics Dispensing Coin Tray */}
      <div className="mt-5 border border-blue-100 bg-blue-50/40 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 font-sans">
            <ArrowDownToLine className="w-3.5 h-3.5 text-blue-600" />
            下方零錢漏斗托盤 (Dispenser Output Tray)
          </span>
          {displayedTrayCoins.length > 0 && (
            <button
              onClick={clearTray}
              className="text-[10px] text-blue-600 hover:text-blue-800 bg-white border border-slate-200 px-2 py-1 rounded-md transition hover:bg-slate-50 cursor-pointer shadow-xs font-semibold font-sans"
            >
              取出托盤零錢 (Clear)
            </button>
          )}
        </div>

        <div className="min-h-16 bg-white rounded-lg p-2 flex flex-wrap gap-1.5 items-end justify-center overflow-y-auto max-h-24 relative border border-slate-200 shadow-inner">
          {displayedTrayCoins.map((denom, index) => {
            const spec = COIN_SPECS[denom];
            return (
              <div
                key={index}
                className="w-8 h-8 rounded-full border flex items-center justify-center font-bold text-[10px] shadow-sm shrink-0 animate-[coinBounce_0.3s_ease-out_forwards]"
                style={{
                  background: spec.radialGradient,
                  borderColor: spec.borderColor,
                  color: spec.textColor,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15), inset 0 0.5px 0.5px rgba(255,255,255,0.4)',
                }}
              >
                {denom}
              </div>
            );
          })}

          {displayedTrayCoins.length === 0 && !isDispensing && (
            <div className="text-xs text-slate-400 font-medium italic absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none flex items-center gap-1.5">
              <MoveDown className="w-3.5 h-3.5 animate-bounce text-slate-400" />
              提款時，銅板將從上方漏斗滾落至此
            </div>
          )}

          {isDispensing && displayedTrayCoins.length === 0 && (
            <div className="text-xs text-blue-600 font-mono animate-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              CLINK, CLINK... 漏斗分配器輸出中...
            </div>
          )}
        </div>
      </div>

      {/* Advanced Calibration Controls */}
      <div className="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
        <h3 className="font-semibold text-slate-800 flex items-center gap-1.5 mb-3 font-sans">
          <Settings2 className="w-3.5 h-3.5 text-slate-500" />
          錢包感測器校準與管理員控制
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-500 mb-1 font-medium font-sans">皮重空重 (Tare Weight):</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="50"
                max="250"
                step="5"
                value={tareWeightGrams}
                onChange={(e) => {
                  setTareWeightGrams(Number(e.target.value));
                  playCoinSound(1.6);
                }}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="font-mono text-slate-700 shrink-0 w-8 text-right font-bold">{tareWeightGrams}g</span>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <label className="text-slate-500 mb-1.5 font-medium font-sans">重設狀態與補給:</label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setInventory({ 50: 10, 10: 15, 5: 20, 1: 30 });
                  playCoinSound(0.9);
                }}
                className="text-[10px] text-blue-600 hover:text-white bg-white hover:bg-blue-600 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors text-center font-bold flex-1 shadow-sm cursor-pointer"
              >
                補滿 500元
              </button>
              <button
                onClick={() => {
                  setInventory({ 50: 0, 10: 0, 5: 0, 1: 0 });
                  playCoinSound(0.5);
                }}
                className="text-[10px] text-rose-600 hover:text-white bg-white hover:bg-rose-600 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors text-center font-bold flex-1 shadow-sm cursor-pointer"
              >
                清空零錢
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded CSS for animations */}
      <style>{`
        @keyframes coinFall {
          0% {
            transform: translateY(0px) rotate(0deg) scale(0.95);
            opacity: 1;
          }
          40% {
            transform: translateY(22px) rotate(180deg) scale(0.95);
            opacity: 0.9;
          }
          75% {
            transform: translateY(50px) rotate(360deg) scale(0.9);
            opacity: 0.8;
          }
          100% {
            transform: translateY(120px) rotate(540deg) scale(0.85);
            opacity: 0;
          }
        }
        
        @keyframes coinBounce {
          0% {
            transform: translateY(-20px) scale(0.7) rotate(-30deg);
            filter: brightness(1.3);
          }
          50% {
            transform: translateY(4px) scale(1.05) rotate(10deg);
          }
          100% {
            transform: translateY(0px) scale(1) rotate(0deg);
          }
        }
      `}</style>
    </div>
  );
}
