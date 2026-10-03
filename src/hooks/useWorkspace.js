import { useState, useEffect } from "react";
import { readWorkspace, WORKSPACE_EVENT } from "../utils/workspace";

export function useWorkspace() {
  const [ws, setWs] = useState(readWorkspace);

  useEffect(() => {
    const handler = () => setWs(readWorkspace());
    window.addEventListener(WORKSPACE_EVENT, handler);
    return () => window.removeEventListener(WORKSPACE_EVENT, handler);
  }, []);

  return ws;
}
