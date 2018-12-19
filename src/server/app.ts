import express from "express";
import { Binance } from "../Binance";
// import { Bitfinex } from "../Bitfinex";
import { MessageLog, LogTransformer } from "../utils";
// MessageLog.pipe(LogTransformer).pipe(process.stdout);

const app = express();
const binance = new Binance();
binance.listenAllOrderBook()

app.get("/binance/:base/:quote", (req: any, res: any, next: any) => {
  (async (): Promise<void> => {
    const { base, quote } = req.params;
    const symbol = `${base}/${quote}`;
    const data = await binance.localOrderBook(symbol);
    res.send(data);
  })().catch(next)
});

app.get("/binance/close-all", (req: any, res: any, next: any) => {
  binance.closeAllSocket();
  res.send("DONE");
})

app.listen(3000);
