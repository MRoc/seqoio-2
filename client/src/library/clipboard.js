import { createLogger } from "../library/logger.js";

const logger = createLogger({ name: "Clipboard" });

export function getClipboardText(event) {
  const clipboardData = event.clipboardData || window.clipboardData;
  return clipboardData.getData("Text");
}

export function setClipboardText(text) {
  navigator.clipboard.writeText(text).then(
    function () {
      logger.info("Async: Copying to clipboard was successful!");
    },
    function (err) {
      logger.error("Async: Could not copy text: ", err);
    }
  );
}
