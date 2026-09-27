import { TransactionType } from '../types/realestate';

const inrFullFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrNumberFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

/**
 * Formats an amount in Indian Rupees (INR / ₹) using Lakh and Crore notation
 * for real-estate values (>= ₹1 Lakh), and en-IN currency grouping for smaller figures.
 * Examples:
 *   84_500_000 -> ₹8.45 Cr
 *   112_000_000 -> ₹11.20 Cr
 *   69_000_000 -> ₹6.90 Cr
 *   12_500_000 -> ₹1.25 Cr
 *   8_500_000 -> ₹85 Lakh
 *   285_000 -> ₹2.85 Lakh
 *   48_000 -> ₹48,000
 */
export function formatCurrency(amount: number, _compact = false): string {
  const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;

  if (safeAmount >= 10_000_000) {
    const crores = safeAmount / 10_000_000;
    return `₹${crores.toFixed(2)} Cr`;
  }

  if (safeAmount >= 100_000) {
    const lakhs = safeAmount / 100_000;
    if (Math.abs(lakhs - Math.round(lakhs)) < 0.005) {
      return `₹${Math.round(lakhs)} Lakh`;
    }
    return `₹${lakhs.toFixed(2)} Lakh`;
  }

  return inrFullFormatter.format(Math.round(safeAmount));
}

/**
 * Full numeric Indian Rupee formatting using Intl.NumberFormat('en-IN')
 * e.g. 84500000 -> ₹8,45,00,000
 */
export function formatFullINR(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  return inrFullFormatter.format(Math.round(safeAmount));
}

export function formatPropertyPrice(price: number, transactionType: TransactionType): string {
  const formatted = formatCurrency(price, true);
  return transactionType === 'Rent' ? `${formatted} / mo` : formatted;
}

export function formatNumber(num: number): string {
  const safeNum = Number.isFinite(num) ? num : 0;
  return inrNumberFormatter.format(Math.round(safeNum));
}

export function calculateMonthlyEMI(
  principal: number,
  annualRatePercent: number,
  tenureYears: number
): {
  monthlyEMI: number;
  totalPayment: number;
  totalInterest: number;
  schedule: Array<{
    year: number;
    openingBalance: number;
    principalPaid: number;
    interestPaid: number;
    closingBalance: number;
  }>;
} {
  const P = Math.max(0, principal);
  const r = annualRatePercent / 12 / 100;
  const n = Math.max(1, tenureYears * 12);

  if (P === 0) {
    return { monthlyEMI: 0, totalPayment: 0, totalInterest: 0, schedule: [] };
  }

  if (r === 0) {
    const monthlyEMI = P / n;
    return {
      monthlyEMI,
      totalPayment: P,
      totalInterest: 0,
      schedule: [],
    };
  }

  const factor = Math.pow(1 + r, n);
  const monthlyEMI = (P * r * factor) / (factor - 1);
  const totalPayment = monthlyEMI * n;
  const totalInterest = totalPayment - P;

  const schedule = [];
  let balance = P;

  for (let year = 1; year <= tenureYears; year++) {
    const openingBalance = balance;
    let yearlyPrincipal = 0;
    let yearlyInterest = 0;

    for (let m = 1; m <= 12; m++) {
      const monthInterest = balance * r;
      const monthPrincipal = Math.min(balance, monthlyEMI - monthInterest);
      yearlyInterest += monthInterest;
      yearlyPrincipal += monthPrincipal;
      balance = Math.max(0, balance - monthPrincipal);
    }

    schedule.push({
      year,
      openingBalance: Math.round(openingBalance),
      principalPaid: Math.round(yearlyPrincipal),
      interestPaid: Math.round(yearlyInterest),
      closingBalance: Math.round(balance),
    });
  }

  return {
    monthlyEMI: Math.round(monthlyEMI),
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.round(totalInterest),
    schedule,
  };
}
