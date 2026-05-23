import React, { useState, useEffect } from 'react';
import { CoinDenomination, COIN_SPECS, DispenseTransaction } from '../types';
import { solveOptimalWithdrawal, playCoinSound } from '../utils';
import { 
  ArrowDownCircle, 
  HelpCircle, 
  ChevronRight, 
  History, 
  AlertTriangle, 
  ShieldAlert,
  Loader2, 
  Fingerprint, 
  CheckCircle,
  TrendingDown
} from 'lucide-react';

interface WithdrawalControlProps {
  inventory: Record<CoinDenomination, number>;
  onDispenseStart: (coinsToDispense: { denomination: CoinDenomination; count: number }[]) => void;
  isDispensing: boolean;
  setInventory: React.Dispatch<React.SetStateAction<Record<CoinDenomination, number>>>;
  addTransaction: (tx: DispenseTransaction) => void;
  transactions: DispenseTransaction[];
  clearTransactions: () => void;
}

export default function WithdrawalControl({
  inventory,
  onDispenseStart,
  isDispensing,
  setInventory,
  addTransaction,
  transactions,
  clearTransactions,
}: WithdrawalControlProps) {
  const [withdrawInput, setWithdrawInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Real-time calculation of optimal coin combinations for inputted target
  const targetAmount = parseInt(withdrawInput, 10) || 0;
  
  // Calculate total balance inside wallet
  const currentTotalVal = 
    inventory[50] * 50 + 
    inventory[10] * 10 + 
    inventory[5] * 5 + 
    inventory[1] * 1;

  // Run solver in real-time as the user types
  const solution = solveOptimalWithdrawal(targetAmount, inventory);
  const isExactMatch = solution.total === targetAmount;
  const isOptimalClosest = targetAmount > 0 && solution.total < targetAmount && solution.total > 0;
  
  // Total coins to dispense
  const totalCoinsToDispense = Object.values(solution.coins).reduce((a, b) => a + b, 0);

  // Validate on input changes
  useEffect(() => {
    if (withdrawInput === '') {
      setErrorMessage(null);
      return;
    }

    if (isNaN(targetAmount) || targetAmount <= 0) {
      setErrorMessage('請輸入大於 0 的正整數金額');
    } else if (currentTotalVal === 0) {
      setErrorMessage('錢包內部空空如也，無法進行提款！請先至模擬器存入零錢。');
    } else if (solution.total === 0) {
      setErrorMessage('當前零錢組合過大或不足，無法分配出任何金額。請更換其他金額。');
    } else {
      setErrorMessage(null);
    }
  }, [withdrawInput, inventory, currentTotalVal, solution.total]);

  // Quick preset buttons helper
  const applyPreset = (amount: number) => {
    if (isDispensing) return;
    setWithdrawInput(amount.toString());
    playCoinSound(1.3);
  };

  // Submit withdrawal / Start Funnel dispensing
  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (errorMessage || isDispensing || targetAmount <= 0 || solution.total <= 0) return;

    // 1. Prepare queue of coins to drop
    const queueList: { denomination: CoinDenomination; count: number }[] = [];
    (Object.keys(solution.coins) as unknown as CoinDenomination[])
      .sort((a, b) => b - a) // Drop larger denominations first
      .forEach((denom) => {
        const count = solution.coins[denom];
        if (count > 0) {
          queueList.push({ denomination: denom, count });
        }
      });

    // 2. Invoke simulator animation queue
    onDispenseStart(queueList);

    // 3. Deduct coins from inventory array immediately
    setInventory((prev) => {
      const nextInv = { ...prev };
      (Object.keys(solution.coins) as unknown as CoinDenomination[]).forEach((denom) => {
        nextInv[denom] = Math.max(0, prev[denom] - solution.coins[denom]);
      });
      return nextInv;
    });

    // 4. Create dispense history transaction item
    const tx: DispenseTransaction = {
      id: `TX-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      requestedAmount: targetAmount,
      dispensedAmount: solution.total,
      coinsDispensed: solution.coins,
      success: true,
    };
    addTransaction(tx);

    // Clear input
    setWithdrawInput('');
  };

  return (
    <div id="withdrawal-panel" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full justify-between relative overflow-hidden">
      {/* Premium accent line on top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
      
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
          <ArrowDownCircle className="w-5 h-5 text-rose-500" />
          錢包漏斗提款系統 <span className="text-xs font-normal text-slate-400 font-sans">Smart Coin Funnel Dispenser</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          輸入提款金額，系統將自動控制下方漏斗分配並排出對應硬幣
        </p>
      </div>

      {/* Main Withdrawal Form */}
      <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-sans">
            請輸入提款金額 (NT$):
          </label>
          <div className="relative">
            <input
              type="number"
              placeholder="請輸入金額 (例如 73)"
              value={withdrawInput}
              onChange={(e) => setWithdrawInput(e.target.value)}
              disabled={isDispensing}
              className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl px-4 py-3 text-lg font-extrabold font-mono text-slate-800 focus:outline-none transition shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-extrabold font-mono text-slate-400 text-sm">
              TWD
            </span>
          </div>
        </div>

        {/* Amount Quick Presets */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">快捷鍵設定:</span>
          <div className="flex flex-wrap gap-2">
            {[10, 35, 50, 88, 120, 200].map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => applyPreset(amount)}
                disabled={isDispensing || currentTotalVal < amount}
                className="text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ${amount}
              </button>
            ))}
          </div>
        </div>

        {/* REAL-TIME PREVIEW RESOLUTION */}
        {targetAmount > 0 && !errorMessage && (
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">解算結果預覽:</span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold flex items-center gap-1.5 text-slate-500 shadow-xs">
                <Fingerprint className="w-3 h-3 text-rose-500" />
                漏斗閥演演算法
              </span>
            </div>

            {/* Dispensing breakdown panel */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium text-xs font-sans">預計提款金額:</span>
                  <span className="font-mono text-rose-600 font-extrabold text-xl">NT$ {solution.total}</span>
                </div>
                
                {/* MATCH TYPE FEEDBACK */}
                {isExactMatch ? (
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1 font-sans">
                    <CheckCircle className="w-3.5 h-3.5" />
                    完全符合輸入金額 NT${targetAmount}
                  </span>
                ) : isOptimalClosest ? (
                  <div className="space-y-0.5 mt-1">
                    <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1 font-sans">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      餘額不足/無法湊整！已湊解最接近之安全金額
                    </span>
                    <p className="text-[9px] text-slate-400 font-sans font-medium">
                      (輸入額: NT${targetAmount}，最大輸出不超過: NT${solution.total}，降級成功)
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 font-semibold block">共需排件</span>
                <span className="text-sm font-extrabold text-blue-600 font-mono">
                  {totalCoinsToDispense} <span className="text-[10px] font-medium text-slate-400 font-sans">枚</span>
                </span>
              </div>
            </div>

            {/* Individual coin graphic breakdown layout */}
            <div className="border-t border-slate-150 pt-3 grid grid-cols-4 gap-2">
              {(Object.keys(solution.coins) as unknown as CoinDenomination[])
                .sort((a, b) => b - a)
                .map((denom) => {
                  const count = solution.coins[denom];
                  const spec = COIN_SPECS[denom];
                  return (
                    <div 
                      key={denom} 
                      className={`p-2 rounded-lg border text-center flex flex-col items-center justify-center transition-all ${count > 0 ? 'bg-white border-slate-300 shadow-xs' : 'bg-white/30 border-slate-200 opacity-40'}`}
                    >
                      {/* Scaled coin circle */}
                      <span 
                        className="w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-extrabold shadow-sm select-none shrink-0"
                        style={{
                          background: spec.radialGradient,
                          borderColor: spec.borderColor,
                          color: spec.textColor,
                        }}
                      >
                        ${denom}
                      </span>
                      <span className="text-[10px] font-bold text-slate-800 mt-1.5 font-mono">
                        x{count}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Validation Error Message Box */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 flex gap-2 items-start shrink-0 text-rose-700 shadow-xs">
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-tight font-semibold">{errorMessage}</p>
          </div>
        )}

        {/* Submit Execution Button */}
        <button
          type="submit"
          disabled={
            !!errorMessage || 
            isDispensing || 
            targetAmount <= 0 || 
            solution.total <= 0
          }
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
            errorMessage || targetAmount <= 0 || solution.total <= 0
              ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              : isDispensing
              ? 'bg-rose-50 border border-rose-250 text-rose-600 cursor-not-allowed animate-pulse'
              : 'bg-rose-600 hover:bg-rose-700 text-white transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all'
          }`}
        >
          {isDispensing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
              <span>漏斗作動中：請稍候... (Dispensing)</span>
            </>
          ) : (
            <>
              <span>控制漏斗閥開啟，提款 NT$ {solution.total} 元</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Transaction History ledger (提款歷史記錄) */}
      <div className="mt-5 border-t border-slate-150 pt-4 flex-1 flex flex-col justify-end">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-705 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-slate-500" />
            漏斗分裝排出紀錄簿 (Transaction History)
          </span>
          {transactions.length > 0 && (
            <button
              onClick={() => {
                clearTransactions();
                playCoinSound(1.4);
              }}
              className="text-[10px] text-slate-450 hover:text-slate-700 transition font-bold cursor-pointer hover:underline"
            >
              清除全部
            </button>
          )}
        </div>

        <div className="bg-slate-50 rounded-xl p-1.5 max-h-32 overflow-y-auto space-y-1.5 border border-slate-200 min-h-20 shadow-inner">
          {transactions.map((tx) => {
            const hasDiscrepancy = tx.dispensedAmount !== tx.requestedAmount;
            return (
              <div 
                key={tx.id} 
                className="flex items-center justify-between p-2 rounded-lg bg-white text-[11px] border border-slate-150 hover:border-slate-300 transition-colors shadow-xs"
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[9px] text-slate-400 font-bold">{tx.timestamp}</span>
                    <span className="text-slate-600 font-medium">請求 NT${tx.requestedAmount}</span>
                  </div>
                  {/* Ledger Note about Closest Limit matches */}
                  {hasDiscrepancy && (
                    <span className="text-[9px] text-amber-600 font-bold mt-0.5">
                      ⚠️ 安全降額匹配 (不超額輸出)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-wrap gap-0.5 justify-end">
                    {(Object.keys(tx.coinsDispensed) as unknown as CoinDenomination[]).map((d) => {
                      const count = tx.coinsDispensed[d];
                      if (count === 0) return null;
                      return (
                        <span key={d} className="px-1.5 py-0.5 rounded bg-slate-50 text-[9px] border border-slate-150 font-mono font-bold text-slate-600 shrink-0">
                          {d}元:{count}枚
                        </span>
                      );
                    })}
                  </div>
                  <span className="font-mono font-extrabold text-rose-600 text-xs text-right shrink-0">
                    -NT${tx.dispensedAmount}
                  </span>
                </div>
              </div>
            );
          })}

          {transactions.length === 0 && (
            <div className="text-[11px] text-slate-400 text-center py-5 italic select-none font-medium">
              目前尚無提款動作紀錄
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
