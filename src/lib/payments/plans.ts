export type PaymentsRegion = 'UK' | 'TR';

export type JetonPackage = {
  id: string;
  jetons: number;
  priceUK: number; // GBP
  priceTR: number; // TRY
};

export const JETON_PACKAGES: JetonPackage[] = [
  { id: 'jeton_100', jetons: 100, priceUK: 0.99, priceTR: 39 },
  { id: 'jeton_300', jetons: 300, priceUK: 2.49, priceTR: 99 },
  { id: 'jeton_500', jetons: 500, priceUK: 3.49, priceTR: 149 },
];

export type PremiumPlanId = 'monthly' | 'quarterly' | 'semiannual';

export type PremiumPlan = {
  id: PremiumPlanId;
  months: 1 | 3 | 6;
  priceUK: number;
  originalPriceUK: number | null;
  priceTR: number;
  originalPriceTR: number | null;
};

export const PREMIUM_PLANS: PremiumPlan[] = [
  { id: 'monthly', months: 1, priceUK: 4.99, originalPriceUK: null, priceTR: 199, originalPriceTR: null },
  { id: 'quarterly', months: 3, priceUK: 9.99, originalPriceUK: 14.99, priceTR: 399, originalPriceTR: 599 },
  { id: 'semiannual', months: 6, priceUK: 15.99, originalPriceUK: 29.99, priceTR: 599, originalPriceTR: 999 },
];

export function formatPrice(amount: number, region: PaymentsRegion): string {
  return region === 'TR' ? `₺${amount}` : `£${amount}`;
}

export function planPrice(plan: PremiumPlan, region: PaymentsRegion): { price: number; original: number | null } {
  return region === 'TR' ? { price: plan.priceTR, original: plan.originalPriceTR } : { price: plan.priceUK, original: plan.originalPriceUK };
}

export function packagePrice(pkg: JetonPackage, region: PaymentsRegion): number {
  return region === 'TR' ? pkg.priceTR : pkg.priceUK;
}
