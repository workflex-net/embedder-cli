// Original: src/lib/services/snapshot.ts
// Snapshot service for file state management

export interface FileState {
  path: string;
  content: string;
  timestamp: number;
}

export interface Snapshot {
  id: string;
  timestamp: number;
  files: Map<string, FileState>;
}

export class SnapshotService {
  private registeredFiles: Map<string, FileState> = new Map();
  private snapshots: Snapshot[] = [];

  registerFile(path: string, content: string): void {
    this.registeredFiles.set(path, {
      path,
      content,
      timestamp: Date.now(),
    });
  }

  takeSnapshot(): Snapshot {
    const snapshot: Snapshot = {
      id: `snapshot-${Date.now()}`,
      timestamp: Date.now(),
      files: new Map(this.registeredFiles),
    };
    this.snapshots.push(snapshot);
    return snapshot;
  }

  restoreSnapshot(snapshotId: string): Map<string, FileState> | null {
    const snapshot = this.snapshots.find((s) => s.id === snapshotId);
    if (!snapshot) return null;
    this.registeredFiles = new Map(snapshot.files);
    return snapshot.files;
  }

  getSnapshots(): Snapshot[] {
    return [...this.snapshots];
  }
}
