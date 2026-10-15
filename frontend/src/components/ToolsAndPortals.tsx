/**
 * ToolsAndPortals.tsx
 *
 * Barrel export maintaining 100% backward compatibility for application views.
 * Individual view implementations are modularized under `frontend/src/views/`.
 */

export { BuyView } from '../views/BuyView';
export type { BuyRentViewProps } from '../views/BuyView';

export { RentView } from '../views/RentView';

export { SellView } from '../views/SellView';
export type { SellViewProps } from '../views/SellView';

export { ComparisonView } from '../views/ComparisonView';
export type { ComparisonViewProps } from '../views/ComparisonView';

export { EmiCalculatorView } from '../views/EmiCalculatorView';
export type { EmiCalculatorViewProps } from '../views/EmiCalculatorView';

export { LocalitiesView } from '../views/LocalitiesView';
export type { LocalitiesViewProps } from '../views/LocalitiesView';

export { BlogView } from '../views/BlogView';
export type { BlogViewProps } from '../views/BlogView';

export { ContactView } from '../views/ContactView';
export type { ContactViewProps } from '../views/ContactView';
