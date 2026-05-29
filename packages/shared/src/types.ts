export interface PortfolioTransactionEvent {
  transactionId: string;
  userId: string;
  assetSymbol: string;
  amount: number;
  transactionType: 'BUY' | 'SELL';
  timestamp: Date;
}

export const PORTFOLIO_EXCHANGE = 'portfolio_events';
export const TRANSACTION_ROUTING_KEY = 'transaction.created';
export const PORTFOLIO_DLX = 'portfolio_dlx';
export const PORTFOLIO_DLQ = 'portfolio_dlq';
