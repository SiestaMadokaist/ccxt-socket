import { Exchange, OrderBook } from "ccxt";
import { MessageLog, Constructor } from "../utils";
import { maybe, IMaybe } from "typescript-monads";
import { Bids, Asks } from 'ccxt-orderbook-handler';
import WebSocket from "ws";

interface CustomOrderBook {
  bids: Bids;
  asks: Asks;
  datetime?: string;
  timestamp?: number;
  nonce?: number;
};

export function withOrderBookSocket(superclass: Constructor<Exchange>){

  const sockets: unique symbol = Symbol("sockets");
  const onMessage: unique symbol = Symbol("onMessage");
  abstract class Socketable extends superclass {
    private [sockets]: Map<string, WebSocket> = new Map();
    orderBooks: Map<string, CustomOrderBook> = new Map();

    protected abstract socketBaseURL(): string

    protected abstract getSocketURL(symbol: string): string;

    async listenOrderBook(symbol: string, limit?: number): Promise<WebSocket> {
      await this.loadMarkets();
      const orderBook = await super.fetchOrderBook(symbol, limit);
      const bidsHandler = new Bids(orderBook.bids);
      const asksHandler = new Asks(orderBook.asks);
      this.orderBooks.set(symbol, { bids: bidsHandler, asks: asksHandler, datetime: (new Date()).toString(), timestamp: Date.now(), nonce: orderBook.nonce });
      const socket = this.getOrderBookSocket(symbol);
      return socket;
    };

    async localOrderBook(symbol: string, ...args: any[]): Promise<OrderBook> {
      if(this[sockets].get(symbol) === undefined){
        const resp = await this.listenOrderBook(symbol);
      };
      const { bids, asks, datetime, timestamp, nonce } = this.orderBooks.get(symbol);
      return {
        nonce,
        bids: bids.toArray(),
        asks: asks.toArray(),
        datetime,
        timestamp,
      };
    };

    protected abstract socketMessageNonce(data: any): number;

    async handleOrderBookEvent(client: WebSocket, symbol: string, orderBookEvent: string): Promise<void> {
      const data = JSON.parse(orderBookEvent);
      const newOrderBook = this.parseOrderBook(data);
      const oldOrderBook = this.orderBooks.get(symbol);
      const { bids, asks } = oldOrderBook;
      bids.pushMulti(newOrderBook.bids);
      asks.pushMulti(newOrderBook.asks);
      const combinedOrderBook = {
        bids,
        asks,
        datetime: (new Date()).toString(),
        timestamp: 0,
        nonce: this.socketMessageNonce(data),
      };
      this.orderBooks.set(symbol, combinedOrderBook);
    }

    protected onSocketError(client: WebSocket, error: Error) {
      MessageLog.error(error);
      try {
        client.close();
      } catch(error) {
        MessageLog.error(error);
      }
    }

    closeAllSocket(){
      Array.from(this[sockets]).forEach(([k, client]) => client.close());
    };

    activeSockets(){
      return Array.from(this[sockets].keys());
    }


    protected onSocketClose(client: WebSocket, symbol: string, ...message: any[]) {
      this[sockets].delete(symbol);
    }

    protected initializeNewOrderBookSocket(symbol: string): WebSocket {
      const socketURL = this.getSocketURL(symbol);
      const client = new WebSocket(socketURL);

      client.on("upgrade", (...message: any[]) => {
        // console.log("upgraded", message);
      })

      client.on("unexpected-response", (...message: any[]) => {
        // console.log(message);
      })

      client.on("pong", (...message: any[]) => {
        // console.log("ponged", message);
      })

      client.on("ping", (...message: any[]) => {
        // console.log("pinged", message);
      })

      client.on("close", (...message: any[]) => {
        this.onSocketClose(client, symbol, message);
      });

      client.on("open", (...message: any[]) => {
        this.onSocketOpen(client, symbol, socketURL, ...message);
      });

      client.on("message", (message: string) => {
        this.handleOrderBookEvent(client, symbol, message).catch((error) => {
          MessageLog.error(error);
        })
      });

      client.on("error", (error: Error) => {
        this.onSocketError(client, error);
      });

      return client;
    }

    protected onSocketOpen(client: WebSocket, symbol: string, socketURL: string, ...message: any[]){
      MessageLog.info(`Socket[${this.name}] connected to ${socketURL} with message: ${message}`);
    };

    private getOrderBookSocket(symbol: string): WebSocket {
      const currentSocket = this[sockets].get(symbol);
      if(currentSocket === undefined){
        const newSocket = this.initializeNewOrderBookSocket(symbol);
        this[sockets].set(symbol, newSocket);
        return newSocket;
      }
      return currentSocket;
    };
  }
  return Socketable

}
