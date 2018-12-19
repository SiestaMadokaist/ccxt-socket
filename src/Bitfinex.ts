import ccxt from "ccxt";
import { withOrderBookSocket } from "./mixin/WithOrderBookSocket";
import path from "path";
import { MessageLog } from "./utils";
import WebSocket from "ws";

export class Bitfinex extends withOrderBookSocket(ccxt.bitfinex) {

  protected socketBaseURL(): string {
    return "wss://api.bitfinex.com/ws/2";
  }

  protected socketMessageNonce(data: any): number {
    return Date.now();
  }

  protected getSocketURL(symbol: string): string {
    return this.socketBaseURL();
  }
}
