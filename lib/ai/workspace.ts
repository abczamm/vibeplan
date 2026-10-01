import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { FileChange, CodingAgentStep } from "./coding-agent";

export class WorkspaceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkspaceError";
  }
}

export class Workspace {
  private root: string;
  private snapshots: Map<string, string> = new Map(); // snapshotId -> snapshotDir

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  private normalizeAndValidatePath(unsafePath: string): string {
    if (unsafePath.includes("\0")) {
      throw new WorkspaceError("Null bytes are not allowed in paths.");
    }
    const resolvedPath = path.resolve(this.root, unsafePath);
    if (!resolvedPath.startsWith(this.root)) {
      throw new WorkspaceError(`Path traversal detected: ${unsafePath}`);
    }
    const relativePath = path.relative(this.root, resolvedPath);
    const parts = relativePath.split(path.sep);

    if (parts.includes(".git") || parts.some((p) => p.startsWith(".env")) || parts.includes("node_modules")) {
      throw new WorkspaceError(`Access to protected path denied: ${unsafePath}`);
    }
    const forbiddenKeywords = ["credentials", "private_key", "secret"];
    if (forbiddenKeywords.some((kw) => parts.some((p) => p.toLowerCase().includes(kw)))) {
      throw new WorkspaceError(`Access to protected keyword in path denied: ${unsafePath}`);
    }
    return resolvedPath;
  }

  private async getFileHash(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath);
      return crypto.createHash("sha256").update(content).digest("hex");
    } catch {
      return "";
    }
  }

  private async getFileSize(filePath: string): Promise<number> {
    try {
      const stat = await fs.stat(filePath);
      return stat.size;
    } catch {
      return 0;
    }
  }

  async exists(unsafePath: string): Promise<boolean> {
    const safePath = this.normalizeAndValidatePath(unsafePath);
    try {
      await fs.access(safePath);
      return true;
    } catch {
      return false;
    }
  }

  async readFile(unsafePath: string): Promise<string> {
    const safePath = this.normalizeAndValidatePath(unsafePath);
    return fs.readFile(safePath, "utf-8");
  }

  async writeFile(unsafePath: string, content: string, taskId: string, reason: string): Promise<FileChange> {
    const safePath = this.normalizeAndValidatePath(unsafePath);
    const isExisting = await this.exists(unsafePath);
    
    let prevHash = "";
    let prevSize = 0;
    
    if (isExisting) {
      prevHash = await this.getFileHash(safePath);
      prevSize = await this.getFileSize(safePath);
    } else {
      await fs.mkdir(path.dirname(safePath), { recursive: true });
    }

    await fs.writeFile(safePath, content, "utf-8");

    const newHash = await this.getFileHash(safePath);
    const newSize = await this.getFileSize(safePath);

    return {
      path: unsafePath,
      operation: isExisting ? "modify" : "create",
      previous_hash: prevHash,
      new_hash: newHash,
      previous_size: prevSize,
      new_size: newSize,
      reason,
      engineering_task_id: taskId,
    };
  }

  async deleteFile(unsafePath: string, taskId: string, reason: string): Promise<FileChange> {
    const safePath = this.normalizeAndValidatePath(unsafePath);
    if (!(await this.exists(unsafePath))) {
      throw new WorkspaceError(`File not found: ${unsafePath}`);
    }

    const prevHash = await this.getFileHash(safePath);
    const prevSize = await this.getFileSize(safePath);

    await fs.unlink(safePath);

    return {
      path: unsafePath,
      operation: "delete",
      previous_hash: prevHash,
      previous_size: prevSize,
      new_size: 0,
      reason,
      engineering_task_id: taskId,
    };
  }

  async listFiles(unsafeDir: string = "."): Promise<string[]> {
    const safeDir = this.normalizeAndValidatePath(unsafeDir);
    const results: string[] = [];

    async function walk(dir: string, baseDir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === ".git" || entry.name.startsWith(".env") || entry.name === "node_modules" || entry.name === ".workspace_snapshots") continue;
        const res = path.resolve(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(res, baseDir);
        } else {
          results.push(path.relative(baseDir, res));
        }
      }
    }

    try {
      await walk(safeDir, this.root);
    } catch {
      // dir doesn't exist
    }
    return results;
  }

  async createDirectory(unsafeDir: string): Promise<void> {
    const safeDir = this.normalizeAndValidatePath(unsafeDir);
    await fs.mkdir(safeDir, { recursive: true });
  }

  async applyChanges(steps: CodingAgentStep[], allowedFiles?: string[]): Promise<FileChange[]> {
    const changes: FileChange[] = [];
    for (const step of steps) {
      // If allowed files specified, check them
      if (allowedFiles && !allowedFiles.includes(step.path)) {
        throw new WorkspaceError(`Out of scope change detected on file: ${step.path}`);
      }

      if (step.operation === "create" || step.operation === "modify") {
        if (step.content === undefined) {
          throw new WorkspaceError(`Content required for ${step.operation} on ${step.path}`);
        }
        changes.push(await this.writeFile(step.path, step.content, step.task_id, step.reason));
      } else if (step.operation === "delete") {
        changes.push(await this.deleteFile(step.path, step.task_id, step.reason));
      }
    }
    return changes;
  }

  async snapshot(snapshotId: string): Promise<void> {
    const snapshotDir = path.join(this.root, ".workspace_snapshots", snapshotId);
    await fs.mkdir(snapshotDir, { recursive: true });
    this.snapshots.set(snapshotId, snapshotDir);
    
    const files = await this.listFiles(".");
    for (const file of files) {
      const src = path.join(this.root, file);
      const dest = path.join(snapshotDir, file);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.copyFile(src, dest);
    }
  }

  async restore(snapshotId: string): Promise<void> {
    const snapshotDir = this.snapshots.get(snapshotId);
    if (!snapshotDir) {
      throw new WorkspaceError(`Snapshot not found: ${snapshotId}`);
    }

    // Delete current files that are not protected
    const currentFiles = await this.listFiles(".");
    for (const file of currentFiles) {
      const src = path.join(this.root, file);
      await fs.unlink(src);
    }

    // Restore from snapshot
    const walkRestoring = async (dir: string, baseSnapshotDir: string, rootDir: string) => {
      let entries;
      try {
        entries = await fs.readdir(dir, { withFileTypes: true });
      } catch {
        return; // Directory doesn't exist or is empty
      }
      for (const entry of entries) {
        const res = path.resolve(dir, entry.name);
        const rel = path.relative(baseSnapshotDir, res);
        const target = path.join(rootDir, rel);
        if (entry.isDirectory()) {
          await fs.mkdir(target, { recursive: true });
          await walkRestoring(res, baseSnapshotDir, rootDir);
        } else {
          await fs.mkdir(path.dirname(target), { recursive: true });
          await fs.copyFile(res, target);
        }
      }
    };
    await walkRestoring(snapshotDir, snapshotDir, this.root);
  }
}
