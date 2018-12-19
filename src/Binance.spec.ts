import "mocha"
import chai from "chai"
import { Binance } from './Binance';
import { LogTransformer, MessageLog } from "./utils";
MessageLog.pipe(LogTransformer).pipe(process.stdout);

describe("Binance", () => {
  describe("WithSocket", function() {
    it("update the orderbook correctly", async function() {
      const symbol = 'BNB/BTC';
      const binance = new Binance();
      const socket = await binance.listenOrderBook(symbol);
      socket.on("message", () => {
        socket.close();
      });
    });
  });
});
