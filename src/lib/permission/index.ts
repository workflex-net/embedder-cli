// Permission system

export interface PermissionRequest {
  id: string;
  type: "file_read" | "file_write" | "execute" | "network" | "system";
  resource: string;
  description: string;
  timestamp: number;
}

export type PermissionDecision = "allow" | "deny" | "allow_always";

type PermissionHandler = (
  request: PermissionRequest,
) => Promise<PermissionDecision>;

export class PermissionQueue {
  private queue: PermissionRequest[] = [];
  private handler: PermissionHandler | null = null;
  private allowedPaths: Set<string> = new Set();

  setHandler(handler: PermissionHandler): void {
    this.handler = handler;
  }

  async enqueue(request: PermissionRequest): Promise<PermissionDecision> {
    if (this.allowedPaths.has(request.resource)) {
      return "allow";
    }

    this.queue.push(request);

    if (!this.handler) {
      return "deny";
    }

    const decision = await this.handler(request);
    this.queue = this.queue.filter((r) => r.id !== request.id);

    if (decision === "allow_always") {
      this.allowedPaths.add(request.resource);
    }

    return decision;
  }

  getPending(): PermissionRequest[] {
    return [...this.queue];
  }

  clearAllowed(): void {
    this.allowedPaths.clear();
  }
}

/** Global permission queue (pO) */
export const pO = new PermissionQueue();

export async function askPermission(
  type: PermissionRequest["type"],
  resource: string,
  description: string,
): Promise<PermissionDecision> {
  const request: PermissionRequest = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    resource,
    description,
    timestamp: Date.now(),
  };
  return pO.enqueue(request);
}

export default { PermissionQueue, pO, askPermission };
