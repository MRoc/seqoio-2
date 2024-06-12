import {
  createLogger as createBunyanLogger,
  stdSerializers,
} from "browser-bunyan";
import { ConsoleFormattedStream } from "@browser-bunyan/console-formatted-stream";

function loggingLevelToNumber(loggingLevel) {
  switch (loggingLevel) {
    case "trace":
      return 10;
    case "debug":
      return 20;
    case "info":
      return 30;
    case "warn":
      return 40;
    case "error":
      return 50;
    case "fatal":
      return 60;
    default:
      return 40;
  }
}

export function createLogger({ name }) {
  return createBunyanLogger({
    name: name,
    streams: [
      {
        level: loggingLevelToNumber(process.env.REACT_APP_LOGGING_LEVEL),
        stream: new ConsoleFormattedStream(),
      },
    ],
    serializers: stdSerializers,
    src: false,
  });
}
