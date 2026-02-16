import { useState, useCallback } from "react";

interface ActionState {
  loading: boolean;
  message: string;
}

export function useAction() {
  const [state, setState] = useState<ActionState>({ loading: false, message: "" });

  const execute = useCallback(
    async (action: () => Promise<{ success: boolean; message: string }>) => {
      setState({ loading: true, message: "Executing..." });
      try {
        const result = await action();
        setState({ loading: false, message: result.message });
        return result.success;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Action failed";
        setState({ loading: false, message: msg });
        return false;
      }
    },
    [],
  );

  const clear = useCallback(() => setState({ loading: false, message: "" }), []);

  return { ...state, execute, clear };
}
