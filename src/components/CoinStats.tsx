import React, { useState } from 'react';
import { CoinDenomination, COIN_SPECS } from '../types';
import { solveCoinsFromTotalWeight, getInventoryWeight } from '../utils';
import { 
  BarChart4, 
  HelpCircle, 
  Coins, 
  Sparkles, 
  CheckCircle2, 
  Weight, 
  TrendingUp, 
  CircleDot 
} from 'lucide-react';

interface CoinStatsProps {
  inventory: Record<CoinDenomination, number>;
  sensorMode: 'separate' | 'combined';
  setInventory: React.Dispatch<React.SetStateAction<Record<CoinDenomination, number>>>;
}

export default function CoinStats({
  inventory,
  sensorMode,
  setInventory,
}: CoinStatsProps) {
  const [selectedMatchIdx, setSelectedMatchIdx] = useState<number>(0);
  
  // Calculate total balance
  const totalBalance = 
    inventory[50] * 50 + 
    inventory[10] * 10 + 
    inventory[5] * 5 + 
    inventory[1] * 1;

  const totalCoinsCount = 
    inventory[50] + 
    inventory[10] + 
    inventory[5] + 
    inventory[1];

  const currentCoinsWeight = getInventoryWeight(inventory);

  // If in combined mode, run backtracking algorithm to find candidate matches
  const weightMatches = solveCoinsFromTotalWeight(currentCoinsWeight);

  // Apply resolved match counts to the inventory
  const applyMatchCombination = (coins: Record<CoinDenomination, number>) => {
    setInventory(coins);
  };

  // Find max coin count for scaling bar charts nicely
  const maxCountInInventory = Math.max(
    ...Object.values(inventory),
    10 // Fallback minimum scale limit
  );

  return (
    <div id="coin-stats" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full relative overflow-hidden">
      
      {/* Premium accent line on top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />

      {/* Title */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
            <Coins className="w-5 h-5 text-blue-600" />
            零錢餘額與圖表分析 <span className="text-xs font-normal text-slate-400 font-sans">Coin Balance & Analysis</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            即時解算硬幣剩餘額度、實體立體硬幣堆疊及高精度分配圓條圖
          </p>
        </div>
      </div>

      {/* Balance Ring Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        
        {/* Card 1: Balance Inquiry (餘額查詢) */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-semibold block mb-1">
            當前零錢總餘額
          </span>
          <div>
            <div className="text-3xl font-extrabold text-blue-700 font-mono flex items-baseline gap-1">
              <span className="text-lg text-blue-600 font-bold">NT$</span>
              <span>{totalBalance.toLocaleString()}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">
              總硬幣個數: <span className="font-mono text-slate-700 font-bold">{totalCoinsCount}</span> 枚
            </p>
          </div>
          <p className="text-[10px] text-slate-600 bg-white p-1.5 rounded-lg border border-slate-200 mt-2.5 flex items-center gap-1.5 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            狀態正常 | 漏斗開關準備中
          </p>
        </div>

        {/* Card 2: Current Coins Weight (總重量數據) */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-semibold block mb-1">
            銅板純物理淨重
          </span>
          <div>
            <div className="text-3xl font-extrabold text-slate-800 font-mono flex items-baseline gap-1">
              <span>{currentCoinsWeight.toFixed(1)}</span>
              <span className="text-xs text-slate-500 font-bold">克 (g)</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">
              約等同于 <span className="font-mono text-slate-700 font-bold">{(currentCoinsWeight / 1000).toFixed(3)}</span> 公斤 (kg)
            </p>
          </div>
          <div className="text-[10px] text-slate-605 bg-white p-1.5 rounded-lg border border-slate-200 mt-2.5 flex items-center gap-1.5 font-mono font-medium">
            <Weight className="w-3.5 h-3.5 text-slate-500" />
            100% 反重量推演
          </div>
        </div>

        {/* Card 3: Sensor Simulation Status (特徵分析) */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-semibold block mb-1">
            傳感分析信賴度
          </span>
          {sensorMode === 'separate' ? (
            <div>
              <div className="text-2xl font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                <span className="text-sm font-bold font-sans">99.9% 獨立感測</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 leading-tight">
                4枚獨立重力傳感器數據已自動同步，零誤差校準。
              </p>
            </div>
          ) : (
            <div>
              <div className="text-2xl font-bold text-blue-600 flex items-center gap-1">
                <Sparkles className="w-4.5 h-4.5 text-blue-600 animate-pulse" />
                <span className="text-sm font-bold font-sans">混合運算中</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-tight mb-1">
                單一混合重力感應，已使用逆運演算法估演最密配方。
              </p>
            </div>
          )}
          <div className="text-[9px] text-slate-400 border-t border-slate-200 pt-1.5 mt-2 font-mono">
            更新時間: {new Date().toLocaleTimeString()}
          </div>
        </div>

      </div>

      {/* COMBINED SENSOR MATCH REPORT EXPLANATION */}
      {sensorMode === 'combined' && (
        <div className="bg-blue-50/50 border border-blue-105 rounded-xl p-4 mb-5 text-xs text-slate-700 shadow-xs">
          <div className="flex items-center gap-1.5 mb-1 text-blue-800 font-semibold font-sans">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            混合式重力分析報表 (重量逆推匹配)
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed mb-3">
            當前淨重 <strong className="text-slate-800">{currentCoinsWeight.toFixed(1)}g</strong>。底部總重承重板支持多元件求解，以下是按誤差比率反推出最有可能的零錢分配組合（已排出最符合組合，您可以選擇其中一鍵套用校準）：
          </p>

          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {weightMatches.map((match, idx) => {
              const isSelected = 
                inventory[50] === match.coins[50] &&
                inventory[10] === match.coins[10] &&
                inventory[5] === match.coins[5] &&
                inventory[1] === match.coins[1];

              return (
                <div 
                  key={idx}
                  className={`flex items-center justify-between p-2 rounded-lg border transition ${isSelected ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-350 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-bold ${idx === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {idx + 1}
                    </span>
                    <span className="font-mono font-bold text-blue-700">
                      NT${match.totalValue}
                    </span>
                    <span className="text-slate-350">|</span>
                    <span className="text-[11px] text-slate-550 font-mono">
                      (50元:{match.coins[50]} | 10元:{match.coins[10]} | 5元:{match.coins[5]} | 1元:{match.coins[1]})
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      重: {match.totalWeightGrams}g (誤差: {match.errorGrams}g)
                    </span>
                    <button
                      onClick={() => applyMatchCombination(match.coins)}
                      disabled={isSelected}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer ${isSelected ? 'bg-blue-150 text-blue-705 cursor-default' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'}`}
                    >
                      {isSelected ? '已符合' : '套用'}
                    </button>
                  </div>
                </div>
              );
            })}

            {weightMatches.length === 0 && (
              <div className="text-slate-405 italic text-center py-2 font-medium">
                沒有高精度匹配的配方，請增加/減少零錢重置。
              </div>
            )}
          </div>
        </div>
      )}

      {/* Two-Column Display: Bar Chart & Physical Stack Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        
        {/* Column Left: High Contrast Bar Charts (條狀圖表) */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col justify-between shadow-xs">
          <div className="flex items-center gap-1.5 mb-4 border-b border-slate-100 pb-2.5">
            <BarChart4 className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-slate-800 font-sans">硬幣數量分配條狀圖 (Dynamic Bar Chart)</span>
          </div>

          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {(Object.keys(COIN_SPECS) as unknown as CoinDenomination[]).map((denomStr) => {
              const denom = Number(denomStr) as CoinDenomination;
              const spec = COIN_SPECS[denom];
              const count = inventory[denom];
              
              // Percentage calculation
              const percentage = (count / maxCountInInventory) * 100;
              const coinValueSum = count * denom;

              return (
                <div key={denom} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono font-semibold">
                    <span className="text-slate-700 flex items-center gap-1.5 font-sans">
                      <span className="w-2.5 h-2.5 rounded-full shadow-xs" style={{ backgroundColor: spec.color }} />
                      {spec.label}
                    </span>
                    <span className="text-slate-550 font-sans">
                      <span className="text-slate-800 font-mono font-bold">{count}</span> 枚 
                      <span className="text-slate-400 ml-1 font-mono">(NT${coinValueSum})</span>
                    </span>
                  </div>
                  
                  {/* Custom Tailwind Bar Chart */}
                  <div className="h-6 bg-slate-50 rounded-lg overflow-hidden border border-slate-200 p-0.5 flex relative shadow-inner">
                    <div 
                      className="h-full rounded transition-all duration-700 ease-out relative group/bar"
                      style={{
                        width: `${Math.max(percentage, 1)}%`,
                        background: `linear-gradient(90deg, ${spec.color}44 0%, ${spec.color}bb 100%)`,
                        border: `1px solid ${spec.borderColor}`
                      }}
                    >
                      {/* Bar shimmer */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    </div>
                    {/* Visual background Grid ruler */}
                    <div className="absolute inset-0 flex justify-between px-3 pointer-events-none text-[8px] font-mono text-slate-400 font-medium items-center select-none">
                      <span>0</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>MAX</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-slate-400 mt-5 pt-2 border-t border-slate-100 text-center select-none font-mono font-medium">
            Ruler scaled automatically against maximum stack count ({maxCountInInventory} coins)
          </div>
        </div>

        {/* Column Right: Elegant Pile Stack View with Physical Coin Graphics (實際銅板圖) */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-1.5">
              <CircleDot className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-slate-800 font-sans">實體銅板圖像展示 (Physical Coins Stack)</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-tight mb-4 select-none font-medium">
            3D 質感金屬壓鑄法渲染的新台幣銅板，動態堆疊顯示錢包內實際銅板物理厚度與光澤感：
          </p>

          {/* Actual 3D Coin Graphics Pile */}
          <div className="grid grid-cols-4 gap-2 bg-gradient-to-b from-slate-50 to-slate-100 p-3 rounded-lg border border-slate-200 min-h-[160px] flex-1 items-end shadow-inner">
            
            {(Object.keys(COIN_SPECS) as unknown as CoinDenomination[]).map((denomStr) => {
              const denom = Number(denomStr) as CoinDenomination;
              const spec = COIN_SPECS[denom];
              const count = inventory[denom];
              
              // Stack maximum render limit to fit screen nicely
              const displayedStackLevel = Math.min(count, 12);

              return (
                <div key={denom} className="flex flex-col items-center justify-end h-full relative group">
                  
                  {/* Dynamic Stack Height Container */}
                  <div className="w-full relative min-h-[96px] flex flex-col-reverse items-center pb-2">
                    {Array.from({ length: displayedStackLevel }).map((_, idx) => {
                      const spreadX = (idx * 0.7) % 2 === 0 ? '-1px' : '1px';
                      const shadowDepth = idx * 2.2; // stack shadow
                      
                      return (
                        <div
                          key={idx}
                          className="absolute rounded-full flex items-center justify-center font-serif text-[10px] font-extrabold shadow-md transform hover:scale-110 active:scale-95 transition-transform select-none cursor-pointer"
                          style={{
                            background: spec.radialGradient,
                            borderColor: spec.borderColor,
                            color: spec.textColor,
                            // Size scaled perfectly to original diameter
                            width: `${spec.diameterMm * 1.5}px`,
                            height: `${spec.diameterMm * 1.5}px`,
                            // Stacked displacement
                            bottom: `${idx * 4}px`,
                            left: `calc(50% - ${(spec.diameterMm * 1.5) / 2}px + ${spreadX})`,
                            zIndex: idx + 5,
                            borderWidth: '1.5px',
                            boxShadow: `0 ${shadowDepth}px 2px rgba(0,0,0,0.15), inset 0 1px 1.5px rgba(255,255,255,0.45)`,
                            fontSize: denom === 50 ? '11px' : '9px',
                          }}
                          title={`${spec.label}: 第 ${idx + 1} 枚 / 共 ${count} 枚`}
                        >
                          <span className="pointer-events-none select-none">${denom}</span>
                        </div>
                      );
                    })}

                    {count === 0 && (
                      <div className="text-[10px] text-slate-400 font-mono font-bold py-4">無</div>
                    )}
                  </div>

                  {/* Count indicator labels */}
                  <div className="mt-1 flex flex-col items-center">
                    <span className="text-[12px] font-bold px-1.5 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-xs">
                      {count} 枚
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5 font-mono font-semibold">
                      (NT${count * denom})
                    </span>
                  </div>

                  {/* Over-capacited notification */}
                  {count > 12 && (
                    <span className="absolute top-0 text-[8px] bg-amber-500/90 text-slate-950 font-bold px-1 rounded scale-90 z-40 shadow-xs">
                      +{count - 12}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-400 italic text-center mt-3 select-none font-medium">
            💡 點擊銅板堆可點選查看，層層疊起可幫助掌握儲存厚重度
          </p>
        </div>

      </div>

      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
