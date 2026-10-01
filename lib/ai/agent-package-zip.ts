import JSZip from "jszip";
import {
  EXPORT_ROOT_DIR,
  serializeManifest,
  type AgentPackageExport,
} from "./agent-package-export";

/**
 * Deterministic in-memory ZIP creation. No filesystem writes.
 * All entries live under the `.agent-package/` root directory.
 * Entry timestamps are pinned to a fixed DOS epoch so ZIP bytes are
 * reproducible for identical inputs (environment-independent).
 */
const ZIP_EPOCH = new Date(Date.UTC(1980, 0, 1, 0, 0, 0));

export async function createAgentPackageZip(
  exp: AgentPackageExport,
): Promise<Buffer> {
  const zip = new JSZip();
  const root = EXPORT_ROOT_DIR;

  // Files are already sorted by path (validated), keeping insertion order stable.
  for (const f of exp.files) {
    zip.file(`${root}/${f.path}`, f.content, {
      createFolders: false,
      date: ZIP_EPOCH,
    });
  }
  zip.file(`${root}/MANIFEST.json`, serializeManifest(exp.manifest), {
    createFolders: false,
    date: ZIP_EPOCH,
  });

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  return buffer;
}

/**
 * Safe download filename: never passes raw user input into headers.
 * Result only contains [a-z0-9-].
 */
export function safeDownloadFileName(projectName: string): string {
  const slug =
    projectName
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "")
      .slice(0, 64)
      .replace(/-+$/, "") || "project";
  return `vibeplan-${slug}-agent-package.zip`;
}
