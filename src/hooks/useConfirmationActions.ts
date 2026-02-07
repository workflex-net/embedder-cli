// Original: src/hooks/useConfirmationActions.ts
// Confirmation action hook for tool/permission confirmations
import { useCallback } from "react";

export interface UseConfirmationActionsReturn {
  respond: (confirmed: boolean) => void;
  dismiss: () => void;
}

export function useConfirmationActions(): UseConfirmationActionsReturn {
  const respond = useCallback((confirmed: boolean) => {
    // TODO: restore from lib_app.js - send confirmation response
  }, []);

  const dismiss = useCallback(() => {
    respond(false);
  }, [respond]);

  return { respond, dismiss };
}
