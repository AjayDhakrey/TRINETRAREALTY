import { Request, Response } from 'express';
import * as store from '../db/store';

export async function calculateValuation(req: Request, res: Response): Promise<void> {
  try {
    const { locality, category, areaSqFt, bedrooms, condition } = req.body;
    const localities = await store.getLocalities();
    const locProfile = localities.find((l) => l.name === locality);
    const basePerSqFt = locProfile ? locProfile.avgPricePerSqFt : 18500;

    const categoryMultipliers: Record<string, number> = {
      Penthouse: 1.14,
      Estate: 1.18,
      Villa: 1.08,
      Waterfront: 1.12,
      Townhouse: 1.0,
    };

    const conditionMultipliers: Record<string, number> = {
      'Museum Grade / New': 1.12,
      'Architecturally Restored': 1.04,
      'Original / Needs Work': 0.88,
    };

    const catMult = categoryMultipliers[category] || 1.0;
    const condMult = conditionMultipliers[condition] || 1.0;
    const bedroomBonus = Math.max(0, (Number(bedrooms) - 3) * 0.025);

    const adjustedPerSqFt = Math.round(basePerSqFt * catMult * condMult * (1 + bedroomBonus));
    const estimatedValue = Math.round(adjustedPerSqFt * (Number(areaSqFt) || 3500));
    const lowVal = Math.round(estimatedValue * 0.95);
    const highVal = Math.round(estimatedValue * 1.05);

    const formatInrUnit = (val: number) =>
      val >= 10_000_000
        ? `₹${(val / 10_000_000).toFixed(2)} Cr`
        : `₹${(val / 100_000).toFixed(2)} Lakh`;

    res.json({
      estimatedValue,
      adjustedPerSqFt,
      lowVal,
      highVal,
      estimatedRange: `${formatInrUnit(lowVal)} – ${formatInrUnit(highVal)}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to calculate valuation', details: err.message });
  }
}

