import crypto from "crypto";

interface AsterDexConfig {
  apiKey: string;
  apiSecret: string;
  baseURL: string;
}

interface OrderParams {
  symbol: string;
  side: "BUY" | "SELL";
  type: "LIMIT" | "MARKET";
  quantity: number;
  price?: number;
  timeInForce?: "GTC" | "IOC" | "FOK";
}

interface AccountBalance {
  asset: string;
  availableBalance?: string; // AsterDex uses availableBalance
  walletBalance?: string;
  free?: string; // Binance-style compatibility
  locked?: string; // Binance-style compatibility
  [key: string]: any; // Allow additional fields
}

interface OrderResponse {
  orderId: string;
  symbol: string;
  side: string;
  type: string;
  quantity: string;
  price?: string;
  status: string;
  executedQty: string;
  avgPrice?: string;
  transactTime: number;
  txHash?: string;
}

export class AsterDexClient {
  private apiKey: string;
  private apiSecret: string;
  private baseURL: string;

  constructor(config: AsterDexConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseURL = config.baseURL || "https://fapi.asterdex.com";
  }

  private generateSignature(queryString: string): string {
    return crypto
      .createHmac("sha256", this.apiSecret)
      .update(queryString)
      .digest("hex");
  }

  private buildQueryString(params: Record<string, any>): string {
    return Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join("&");
  }

  private async request(
    method: string,
    endpoint: string,
    params: Record<string, any> = {},
    requiresAuth: boolean = true
  ): Promise<any> {
    const timestamp = Date.now();
    const queryParams = {
      ...params,
      recvWindow: 5000,
      timestamp,
    };

    const queryString = this.buildQueryString(queryParams);
    const signature = this.generateSignature(queryString);
    const fullQueryString = `${queryString}&signature=${signature}`;

    const url = `${this.baseURL}${endpoint}?${fullQueryString}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (requiresAuth) {
      headers["X-MBX-APIKEY"] = this.apiKey;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `AsterDex API Error: ${data.msg || data.message || "Unknown error"}`
        );
      }

      return data;
    } catch (error: any) {
      console.error("AsterDex API Request Failed:", error);
      throw error;
    }
  }

  async getAccount(): Promise<AccountBalance[]> {
    const response = await this.request("GET", "/fapi/v1/account");
    return response.assets || response.balances || [];
  }

  async getBalance(asset: string): Promise<AccountBalance | null> {
    const balances = await this.getAccount();
    return balances.find((b) => b.asset === asset) || null;
  }

  async createOrder(params: OrderParams): Promise<OrderResponse> {
    const orderParams: Record<string, any> = {
      symbol: params.symbol,
      side: params.side,
      type: params.type,
      quantity: params.quantity.toString(),
    };

    if (params.type === "LIMIT") {
      if (!params.price) {
        throw new Error("Price is required for LIMIT orders");
      }
      orderParams.price = params.price.toString();
      orderParams.timeInForce = params.timeInForce || "GTC";
    }

    return await this.request("POST", "/fapi/v1/order", orderParams);
  }

  async getOrder(symbol: string, orderId: string): Promise<OrderResponse> {
    return await this.request("GET", "/fapi/v1/order", {
      symbol,
      orderId,
    });
  }

  async cancelOrder(symbol: string, orderId: string): Promise<OrderResponse> {
    return await this.request("DELETE", "/fapi/v1/order", {
      symbol,
      orderId,
    });
  }

  async getExchangeInfo(): Promise<any> {
    return await this.request("GET", "/fapi/v1/exchangeInfo", {}, false);
  }

  async getPrice(symbol: string): Promise<number> {
    const response = await this.request(
      "GET",
      "/fapi/v1/ticker/price",
      { symbol },
      false
    );
    return parseFloat(response.price);
  }

  async get24hrStats(symbol: string): Promise<any> {
    return await this.request(
      "GET",
      "/fapi/v1/ticker/24hr",
      { symbol },
      false
    );
  }

  /**
   * Get open positions with unrealized PnL
   * Returns positions array with positionAmt, entryPrice, markPrice, unrealizedProfit, etc.
   */
  async getPositions(): Promise<any[]> {
    try {
      const response = await this.request("GET", "/fapi/v2/positionRisk", {});
      // Filter to only return positions with non-zero size
      return (response || []).filter((pos: any) => {
        const positionAmt = parseFloat(pos.positionAmt || pos.position || "0");
        return Math.abs(positionAmt) > 0.000001;
      });
    } catch (error) {
      // Fallback to account endpoint if positionRisk doesn't work
      const account = await this.request("GET", "/fapi/v1/account", {});
      return account.positions || account.assets?.filter((a: any) => 
        parseFloat(a.positionAmt || a.position || "0") !== 0
      ) || [];
    }
  }

  /**
   * Get full account info including positions and balances
   */
  async getAccountInfo(): Promise<any> {
    return await this.request("GET", "/fapi/v1/account", {});
  }
}

export function createAsterDexClient(): AsterDexClient {
  const apiKey = process.env.ASTERDEX_API_KEY;
  const apiSecret = process.env.ASTERDEX_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error(
      "AsterDex API credentials not found in environment variables"
    );
  }

  return new AsterDexClient({
    apiKey,
    apiSecret,
    baseURL: "https://fapi.asterdex.com",
  });
}
