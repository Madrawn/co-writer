import { describe, it, expect, vi, beforeEach } from "vitest";
import { retrieveFiles } from "./retrieveFiles";

// Helper to create a mock File
function createMockFile(name: string, content = "test") {
  return new File([content], name, { type: "text/plain" });
}

describe("retrieveFiles", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("retrieves files when isFolder is false", async () => {
    const mockFile = createMockFile("file1.txt", "abc");
    const mockHandle = {
      getFile: vi.fn().mockResolvedValue(mockFile),
      name: "file1.txt",
    };
    (window as any).showOpenFilePicker = vi.fn().mockResolvedValue([mockHandle]);

    const files = await retrieveFiles(false);
    expect(files).toHaveLength(1);
    expect(files[0].file).toBe(mockFile);
    expect(files[0].path).toBe("file1.txt");
  });

  it("retrieves files recursively when isFolder is true", async () => {
    // Simulate a directory with two files and a subdirectory with one file
    const fileA = createMockFile("a.txt", "A");
    const fileB = createMockFile("b.txt", "B");
    const fileC = createMockFile("c.txt", "C");

    // Subdirectory handle
    const subDirHandle = {
      kind: "directory",
      name: "subdir",
      values: async function* () {
        yield {
          kind: "file",
          name: "c.txt",
          getFile: vi.fn().mockResolvedValue(fileC),
        };
      },
    };

    // Root directory handle
    const dirHandle = {
      kind: "directory",
      name: "root",
      values: async function* () {
        yield {
          kind: "file",
          name: "a.txt",
          getFile: vi.fn().mockResolvedValue(fileA),
        };
        yield {
          kind: "file",
          name: "b.txt",
          getFile: vi.fn().mockResolvedValue(fileB),
        };
        yield subDirHandle;
      },
    };

    (window as any).showDirectoryPicker = vi.fn().mockResolvedValue(dirHandle);

    const files = await retrieveFiles(true);
    // Should flatten all files with correct paths
    expect(files).toEqual([
      { file: fileA, path: "a.txt" },
      { file: fileB, path: "b.txt" },
      { file: fileC, path: "subdir/c.txt" },
    ]);
  });

  it("returns empty array if no files selected", async () => {
    (window as any).showOpenFilePicker = vi.fn().mockResolvedValue([]);
    const files = await retrieveFiles(false);
    expect(files).toEqual([]);
  });

  it("throws if file picker fails", async () => {
    (window as any).showOpenFilePicker = vi.fn().mockRejectedValue(new Error("fail"));
    await expect(retrieveFiles(false)).rejects.toThrow("fail");
  });
});
