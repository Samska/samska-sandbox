import { useEffect, useState } from "react";
import { readDemoMode } from "./demoApi";

export function useDemoMode(): boolean {
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    let active = true;
    void readDemoMode().then((value) => active && setDemo(value));
    return () => {
      active = false;
    };
  }, []);

  return demo;
}
