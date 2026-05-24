import * as React from "react";
import { isApiConfigured, pingHealth } from "@/lib/api";

/**
 * On mount, pings GET /health. If the request takes longer than 2s, `isWaking` is true until it completes.
 */
export function useWakeServer(): { isWaking: boolean } {
  const [isWaking, setIsWaking] = React.useState(false);

  React.useEffect(() => {
    if (!isApiConfigured()) {
      return;
    }

    let done = false;
    const controller = new AbortController();
    const slow = window.setTimeout(() => {
      if (!done) {
        setIsWaking(true);
      }
    }, 2000);

    void pingHealth(controller.signal)
      .catch(() => {
        /* cold start may fail once; banner still helps */
      })
      .finally(() => {
        done = true;
        window.clearTimeout(slow);
        setIsWaking(false);
      });

    return () => {
      done = true;
      controller.abort();
      window.clearTimeout(slow);
    };
  }, []);

  return { isWaking };
}
