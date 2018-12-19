import { Transform, Readable } from 'stream';
export type Constructor<T> = new(...args: any[]) => T;
class EventLog extends Readable {
  objectMode: boolean = true;
  constructor(props?: any){
    super({ ...props, objectMode: true });
  }

  /**
   * @override
   */
  _read(): void {
  }

  debug(message: string): void  {
    this.push({ message, level: "debug" });
  };

  info(message: string): void {
    this.push({ message, level: "info" });
  }

  warn(message: string): void {
    this.push({ message, level: 'warn' });
  }

  error(error: Error): void {
    const { name, message, stack } = error;
    this.push({ name, message, stack, level: 'error' });
  }

};

class EventLogTransformer extends Transform {
  objectMode: boolean = true;
  constructor(props?: any){
    super({ ...props, objectMode: true });
  }

  _transform(chunk: any, encoding: string, callback: Function): void {
    let transformed: string;
    try {
      transformed = JSON.stringify(chunk, null, 2);
    } catch (error){
      transformed = `${chunk.toString()}`;
    };
    this.push(transformed);
    callback();
  }
}

export const LogTransformer = new EventLogTransformer();
export const MessageLog = new EventLog();

export enum TIME {
    MS = 1,
    MILLI_SECOND = 1,
    SECOND = 1000,
    MINUTE = 60 * 1000,
    HOUR = 60 * 60 * 1000,
    DAY = 24 * 60 * 60 * 1000,
    WEEK = 7 * 24 * 60 * 60 * 1000,
}

export const sleep = (span: number, unit: TIME) => {
  return new Promise((rs: any, rj: any) => {
    setTimeout(rs, span * unit);
  });
};
