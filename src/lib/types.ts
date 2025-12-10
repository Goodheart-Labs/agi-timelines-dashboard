export type ChartDataPoint = {
  date: string;
  value: number;
  range?: [number, number]; // [min, max]
};

export type PolymarketDataPoint = {
  t: number;
  p: number;
};

export type PolymarketResponse = {
  history: PolymarketDataPoint[];
};

export type MetaculusResponse = {
  question: {
    id: number;
    scaling: {
      range_min: number;
      range_max: number;
      zero_point: number;
    };
    aggregations: {
      recency_weighted: {
        history: Array<{
          start_time: number;
          end_time: number;
          means: number[] | null;
          centers: number[];
          interval_lower_bounds: number[] | null;
          interval_upper_bounds: number[] | null;
        }>;
      };
    };
    scheduled_close_time: string;
    scheduled_resolve_time: string;
  };
};

export type KalshiMarketData = {
  market: {
    ticker: string;
    title: string;
    open_time: string;
    close_time: string;
    status: string;
    yes_bid: number;
    yes_ask: number;
    no_bid: number;
    no_ask: number;
    last_price: number;
    volume: number;
    volume_24h: number;
  };
};

export type KalshiCandlestick = {
  end_period_ts: number;
  yes_bid: {
    open: number;
    low: number;
    high: number;
    close: number;
  };
  yes_ask: {
    open: number;
    low: number;
    high: number;
    close: number;
  };
  price: {
    open: number | null;
    low: number | null;
    high: number | null;
    close: number | null;
    mean: number | null;
    mean_centi: number | null;
    previous: number | null;
  };
  volume: number;
  open_interest: number;
};

export type KalshiResponse = {
  marketData: KalshiMarketData;
  candlesticks: {
    candlesticks: KalshiCandlestick[];
  };
  dateRange: {
    start: string; // ISO string
    end: string; // ISO string
    interval: number;
  };
};

export type ManifoldResponse = {
  id: string;
  question: string;
  description: {
    type: string;
    content: Array<{
      type: string;
      content?: Array<{
        text?: string;
        type: string;
      }>;
    }>;
  };
  probability: number;
  createdTime: number;
  closeTime: number;
  isResolved: boolean;
  volume: number;
  volume24Hours: number;
  uniqueBettorCount: number;
  lastUpdatedTime: number;
  slug: string;
};

export type Bet = {
  isFilled: boolean;
  amount: number;
  userId: string;
  contractId: string;
  answerId: string;
  probBefore: number;
  isCancelled: boolean;
  outcome: string;
  fees: {
    creatorFee: number;
    liquidityFee: number;
    platformFee: number;
  };
  shares: number;
  limitProb: number;
  id: string;
  loanAmount: number;
  orderAmount: number;
  probAfter: number;
  createdTime: number;
  fills: Array<{
    timestamp: number;
    matchedBetId: string;
    amount: number;
    shares: number;
  }>;
};

export type MetaculusForecast = {
  "Question ID": string;
  "Forecaster ID": string;
  "Forecaster Username": string;
  "Start Time": string;
  "End Time": string;
  "Forecaster Count": string;
  "Probability Yes": string;
  "Probability Yes Per Category": string;
  "Continuous CDF": string;
};
