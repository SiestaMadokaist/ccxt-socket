import ccxt from "ccxt";
import { withOrderBookSocket } from "./mixin/WithOrderBookSocket";
import path from "path";
import { TIME, MessageLog, sleep } from "./utils";
import WebSocket from "ws";

export class Binance extends withOrderBookSocket(ccxt.binance) {

  protected socketBaseURL(): string {
    return "wss://stream.binance.com:9443";
  };

  protected getSocketURL(symbol: string, limit: number = 20): string {
    const info = this.market(symbol);
    const id = info.id.toLowerCase();
    const depth = limit ? `depth${limit}` : `depth`;
    const endpoint = `${id}@${depth}`;
    return path.join(this.socketBaseURL(), "ws", endpoint);
  }

  protected socketMessageNonce(data: any): number {
    return data.lastUpdateId;
  }

  async listenAllOrderBook(): Promise<void>{
    await this.loadMarkets();
    for(const key of Object.keys(this.markets)){
      const info = this.markets[key];
      this.listenOrderBook(info.symbol);
      await sleep(3, TIME.SECOND);
    };
  }

  protected onSocketOpen(client: WebSocket, symbol: string, socketURL: string, ...message: any[]){
    super.onSocketOpen(client, symbol, socketURL, message);
    const SPAN = 3 * TIME.HOUR;
    const BUFFER_SPAN = 1 * TIME.HOUR;
    const RANDOM_SPAN = Math.floor(Math.random() * BUFFER_SPAN);
    const closeTime = new Date(Date.now() + RANDOM_SPAN);
    MessageLog.info(`Socket to ${this.name}[${symbol}] will be closed at approximately ${closeTime}`);
    sleep(SPAN + RANDOM_SPAN, TIME.MS).then(() => {
      client.close();
    }).catch((error) => {
      MessageLog.info(`failed to close socket to ${this.name}[${symbol}]`);
      MessageLog.error(error);
    });
  }
}
