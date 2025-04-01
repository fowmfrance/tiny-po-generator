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
export type BudgetRecognitionType = 'linear' | 'completion';

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

/**
 * Validates if a budget is active based on its start and end dates
 */
export function validateBudgetActive(
  budgetStartDate: Date | null,
  budgetEndDate: Date | null
): { active: boolean; message?: string } {
  const today = new Date();
  
  if (budgetStartDate && today < budgetStartDate) {
    return {
      active: false,
      message: `This budget is not active yet. It starts on ${budgetStartDate.toLocaleDateString()}.`
    };
  }
  
  if (budgetEndDate && today > budgetEndDate) {
    return {
      active: false,
      message: `This budget has expired. It ended on ${budgetEndDate.toLocaleDateString()}.`
    };
  }
  
  return { active: true };
}

/**
 * Calculate recognized amount based on recognition type 
 */
export function calculateRecognizedAmount(
  totalAmount: number,
  recognitionType: BudgetRecognitionType,
  startDate: Date | null,
  endDate: Date | null,
  completionPercentage: number = 0
): { 
  recognizedAmount: number; 
  remainingToRecognize: number;
  recognitionPercentage: number; 
} {
  if (recognitionType === 'completion') {
    // For completion-based recognition, we use the provided completion percentage
    const recognizedAmount = totalAmount * (completionPercentage / 100);
    return {
      recognizedAmount,
      remainingToRecognize: totalAmount - recognizedAmount,
      recognitionPercentage: completionPercentage
    };
  } else {
    // For linear recognition, we calculate based on the elapsed time percentage
    if (!startDate || !endDate) {
      return {
        recognizedAmount: 0,
        remainingToRecognize: totalAmount,
        recognitionPercentage: 0
      };
    }
    
    const today = new Date();
    const totalDuration = endDate.getTime() - startDate.getTime();
    
    // If budget hasn't started yet
    if (today < startDate) {
      return {
        recognizedAmount: 0,
        remainingToRecognize: totalAmount,
        recognitionPercentage: 0
      };
    }
    
    // If budget has ended, recognize 100%
    if (today > endDate) {
      return {
        recognizedAmount: totalAmount,
        remainingToRecognize: 0,
        recognitionPercentage: 100
      };
    }
    
    // Calculate elapsed percentage
    const elapsedTime = today.getTime() - startDate.getTime();
    const elapsedPercentage = Math.min(100, (elapsedTime / totalDuration) * 100);
    const recognizedAmount = totalAmount * (elapsedPercentage / 100);
    
    return {
      recognizedAmount,
      remainingToRecognize: totalAmount - recognizedAmount,
      recognitionPercentage: elapsedPercentage
    };
  }
}

/**
 * Format a currency value with the appropriate symbol
 */
export function formatCurrency(currency: BudgetCurrency, amount: number): string {
  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '€' : '€';
  return `${symbol}${amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
