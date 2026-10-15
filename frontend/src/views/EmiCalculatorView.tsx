import React, { useState } from 'react';
import type { Property, LeadType } from '../types/realestate';
import {
  formatCurrency,
  formatFullINR,
  calculateMonthlyEMI,
} from '../utils/formatters';

export interface EmiCalculatorViewProps {
  properties: Property[];
  initialPropertyId?: string;
  onOpenLeadModal: (type: LeadType, propertyId?: string) => void;
}

export const EmiCalculatorView: React.FC<EmiCalculatorViewProps> = ({
  properties,
  initialPropertyId,
  onOpenLeadModal,
}) => {
  const buyProperties = properties.filter((p) => p.transactionType === 'Buy');
  const [selectedPropId, setSelectedPropId] = useState<string>(() => {
    if (initialPropertyId && buyProperties.some((p) => p.id === initialPropertyId)) {
      return initialPropertyId;
    }
    return buyProperties[0]?.id || 'custom';
  });
  const [propertyValue, setPropertyValue] = useState<number>(() => {
    if (initialPropertyId) {
      const match = buyProperties.find((p) => p.id === initialPropertyId);
      if (match) return match.price;
    }
    return buyProperties[0]?.price || 84500000;
  });
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(30);
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [tenureYears, setTenureYears] = useState<number>(20);

  React.useEffect(() => {
    if (initialPropertyId) {
      const match = buyProperties.find((p) => p.id === initialPropertyId);
      if (match) {
        setSelectedPropId(match.id);
        setPropertyValue(match.price);
      }
    }
  }, [initialPropertyId, properties]);

  const handleSelectPreset = (id: string) => {
    setSelectedPropId(id);
    if (id !== 'custom') {
      const found = buyProperties.find((p) => p.id === id);
      if (found) setPropertyValue(found.price);
    }
  };

  const downPaymentAmount = Math.round((propertyValue * downPaymentPercent) / 100);
  const loanAmount = Math.max(0, propertyValue - downPaymentAmount);
  const { monthlyEMI, totalPayment, totalInterest, schedule } = calculateMonthlyEMI(
    loanAmount,
    interestRate,
    tenureYears
  );

  const principalShare =
    totalPayment > 0 ? Math.round((loanAmount / totalPayment) * 100) : 100;
  const interestShare = 100 - principalShare;

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-8 sm:space-y-12">
      <div className="border-b border-stone-200 pb-5 sm:pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="text-xs text-[#615E59]">
            Private Wealth Debt Service & Amortization Modeling
          </div>
          <h1 className="font-serif-display text-2xl sm:text-5xl font-semibold text-[#141413]">
            Jumbo Mortgage & EMI Calculator
          </h1>
        </div>

        <div>
          <label className="block text-xs text-[#615E59] mb-1">
            Benchmark Against Portfolio Residence
          </label>
          <select
            value={selectedPropId}
            onChange={(e) => handleSelectPreset(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 text-xs bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
          >
            <option value="custom">Custom Principal Valuation</option>
            {buyProperties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.title} ({formatCurrency(p.price)})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-start">
        {/* Left 5 Cols: Interactive Sliders */}
        <div className="lg:col-span-5 bg-[#F3F2EE] border border-stone-200 p-4 sm:p-8 space-y-5 sm:space-y-6">
          <div>
            <div className="flex justify-between text-xs font-medium text-[#141413] mb-2">
              <span>Acquisition Price</span>
              <span className="font-mono-tabular font-semibold">
                {formatCurrency(propertyValue)}
              </span>
            </div>
            <input
              type="range"
              min={5000000}
              max={250000000}
              step={2500000}
              value={propertyValue}
              onChange={(e) => {
                setSelectedPropId('custom');
                setPropertyValue(Number(e.target.value));
              }}
              className="w-full accent-[#1E3A2F]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-[#141413] mb-2">
              <span>Down Payment Equity ({downPaymentPercent}%)</span>
              <span className="font-mono-tabular font-semibold">
                {formatCurrency(downPaymentAmount)}
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={80}
              step={5}
              value={downPaymentPercent}
              onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
              className="w-full accent-[#1E3A2F]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-[#141413] mb-2">
              <span>Annual Interest Rate</span>
              <span className="font-mono-tabular font-semibold">{interestRate.toFixed(2)}%</span>
            </div>
            <input
              type="range"
              min={2.5}
              max={10.0}
              step={0.125}
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full accent-[#1E3A2F]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-[#141413] mb-2">
              <span>Amortization Tenure</span>
              <span className="font-mono-tabular font-semibold">{tenureYears} Years</span>
            </div>
            <input
              type="range"
              min={5}
              max={30}
              step={5}
              value={tenureYears}
              onChange={(e) => setTenureYears(Number(e.target.value))}
              className="w-full accent-[#1E3A2F]"
            />
          </div>

          <div className="pt-4 border-t border-stone-300 space-y-3">
            <div className="text-xs text-[#615E59]">
              Principal ({principalShare}%) vs. Cumulative Interest ({interestShare}%)
            </div>
            <div className="w-full h-3 bg-stone-300 flex overflow-hidden">
              <div
                style={{ width: `${principalShare}%` }}
                className="bg-[#141413] h-full transition-all"
                title={`Principal: ${principalShare}%`}
              />
              <div
                style={{ width: `${interestShare}%` }}
                className="bg-[#1E3A2F] h-full transition-all"
                title={`Interest: ${interestShare}%`}
              />
            </div>
            <div className="flex justify-between text-xs text-[#57534E] font-mono-tabular">
              <span>Principal: {formatCurrency(loanAmount, true)}</span>
              <span>Interest: {formatCurrency(totalInterest, true)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onOpenLeadModal(
                'Property Inquiry',
                selectedPropId !== 'custom' ? selectedPropId : undefined
              )
            }
            className="w-full py-3 text-xs font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors cursor-pointer"
          >
            Request Private Bank Term Sheet
          </button>
        </div>

        {/* Right 7 Cols: Summary Metrics + Annual Amortization Table */}
        <div className="lg:col-span-7 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 bg-[#FBFBF9] border border-stone-300">
              <div className="text-xs text-[#615E59]">Monthly Equated Installment (EMI)</div>
              <div className="font-mono-tabular text-2xl sm:text-3xl font-semibold text-[#1E3A2F] mt-1">
                {formatCurrency(monthlyEMI)}
              </div>
              <div className="text-xs text-[#615E59] mt-1 font-mono-tabular">
                {tenureYears * 12} Monthly Payments
              </div>
            </div>

            <div className="p-6 bg-[#FBFBF9] border border-stone-300">
              <div className="text-xs text-[#615E59]">Financed Loan Principal</div>
              <div className="font-mono-tabular text-2xl sm:text-3xl font-semibold text-[#141413] mt-1">
                {formatCurrency(loanAmount, true)}
              </div>
              <div className="text-xs text-[#615E59] mt-1 font-mono-tabular">
                LTV Ratio: {100 - downPaymentPercent}%
              </div>
            </div>

            <div className="p-6 bg-[#FBFBF9] border border-stone-300">
              <div className="text-xs text-[#615E59]">Total Debt Service Outlay</div>
              <div className="font-mono-tabular text-2xl sm:text-3xl font-semibold text-[#141413] mt-1">
                {formatCurrency(totalPayment, true)}
              </div>
              <div className="text-xs text-[#615E59] mt-1 font-mono-tabular">
                Incl. {formatCurrency(totalInterest, true)} Interest
              </div>
            </div>
          </div>

          {/* Yearly Amortization Schedule Table */}
          <div className="border border-stone-200 bg-[#FBFBF9] overflow-hidden">
            <div className="px-6 py-4 bg-[#F3F2EE] border-b border-stone-200 flex items-center justify-between">
              <h2 className="font-serif-display text-xl font-semibold text-[#141413]">
                Annual Amortization Ledger
              </h2>
              <span className="text-xs text-[#615E59] font-mono-tabular">
                Values in INR (₹) · Tabular Figures
              </span>
            </div>
            <div className="max-h-96 overflow-y-auto overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                <thead className="bg-[#F3F2EE]/50 border-b border-stone-200 sticky top-0">
                  <tr>
                    <th className="py-3 px-4 font-semibold text-[#615E59]">Year</th>
                    <th className="py-3 px-4 font-semibold text-[#615E59] text-right">
                      Opening Balance
                    </th>
                    <th className="py-3 px-4 font-semibold text-[#615E59] text-right">
                      Principal Paid
                    </th>
                    <th className="py-3 px-4 font-semibold text-[#615E59] text-right">
                      Interest Paid
                    </th>
                    <th className="py-3 px-4 font-semibold text-[#615E59] text-right">
                      Closing Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 font-mono-tabular">
                  {schedule.map((row) => (
                    <tr key={row.year} className="hover:bg-[#F3F2EE]/40">
                      <td className="py-2.5 px-4 font-medium text-[#141413]">Year {row.year}</td>
                      <td className="py-2.5 px-4 text-right text-[#57534E]">
                        {formatFullINR(row.openingBalance)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-[#141413] font-medium">
                        {formatFullINR(row.principalPaid)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-[#1E3A2F]">
                        {formatFullINR(row.interestPaid)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-[#141413] font-semibold">
                        {formatFullINR(row.closingBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

