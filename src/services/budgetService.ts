
/**
 * Budget validation and calculation service
 */

// Mock exchange rates (in a real app, these would be fetched from an API)
const exchangeRates = {
  EUR: 1,
  USD: 0.92,  // 1 USD = 0.92 EUR
  GBP: 1.17   // 1 GBP = 1.17 EUR
};

export type BudgetCurrency = 'EUR' | 'USD' | 'GBP';

/**
 * Converts an amount from the source currency to EUR
 */
export function convertToEUR(amount: number, sourceCurrency: BudgetCurrency): number {
  return amount * exchangeRates[sourceCurrency];
}

/**
 * Converts an amount from EUR to the target currency
 */
export function convertFromEUR(amount: number, targetCurrency: BudgetCurrency): number {
  return amount / exchangeRates[targetCurrency];
}

/**
 * Converts an amount from one currency to another
 */
export function convertCurrency(
  amount: number, 
  fromCurrency: BudgetCurrency, 
  toCurrency: BudgetCurrency
): number {
  // Convert to EUR first (our base currency)
  const amountInEUR = convertToEUR(amount, fromCurrency);
  
  // Then convert from EUR to target currency
  if (toCurrency === 'EUR') {
    return amountInEUR;
  }
  
  return convertFromEUR(amountInEUR, toCurrency);
}

/**
 * Checks if a new PO amount would exceed the budget's remaining amount
 */
export function validatePurchaseOrderAmount(
  poAmount: number, 
  poCurrency: BudgetCurrency,
  budgetRemainingAmount: number,
  budgetCurrency: BudgetCurrency
): { valid: boolean; message?: string } {
  // Convert PO amount to budget currency
  const poAmountInBudgetCurrency = convertCurrency(
    poAmount,
    poCurrency,
    budgetCurrency
  );
  
  if (poAmountInBudgetCurrency > budgetRemainingAmount) {
    return {
      valid: false,
      message: `This purchase order would exceed the remaining budget by ${
        (poAmountInBudgetCurrency - budgetRemainingAmount).toFixed(2)
      } ${budgetCurrency}`
    };
  }
  
  return { valid: true };
}

/**
 * Calculate the new remaining amount after a PO is created
 */
export function calculateRemainingBudget(
  currentRemainingAmount: number,
  poAmount: number,
  poCurrency: BudgetCurrency,
  budgetCurrency: BudgetCurrency
): number {
  const poAmountInBudgetCurrency = convertCurrency(
    poAmount,
    poCurrency,
    budgetCurrency
  );
  
  return currentRemainingAmount - poAmountInBudgetCurrency;
}
