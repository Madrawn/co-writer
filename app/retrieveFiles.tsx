"use client";

type OpenFilePickerOptions = {
  multiple?: boolean;
};

type WindowWithFileSystemAccess = Window & {
  showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  showOpenFilePicker?: (options?: OpenFilePickerOptions) => Promise<FileSystemFileHandle[]>;
};

const traverseDirectory = async (
  dirHandle: FileSystemDirectoryHandle,
  path: string = ""
): Promise<{ file: File; path: string }[]> => {
  const files: { file: File; path: string }[] = [];
  // @ts-expect-error: TypeScript does not recognize values() on FileSystemDirectoryHandle, but it exists in browsers
  for await (const entry of dirHandle.values()) {
    const entryPath = `${path}/${entry.name}`;
    if (entry.kind === "file") {
      files.push({
        file: await entry.getFile(),
        path: entryPath.substring(1), // Remove leading slash
      });
    } else if (entry.kind === "directory") {
      files.push(...(await traverseDirectory(entry, entryPath)));
    }
  }
  return files;
};
export async function retrieveFiles(isFolder: boolean) {
  let files = [];

  if (isFolder) {
    const win = window as unknown as WindowWithFileSystemAccess;
    if (!win.showDirectoryPicker) {
      throw new Error('showDirectoryPicker is not supported in this browser.');
    }
    const dirHandle: FileSystemDirectoryHandle = await win.showDirectoryPicker();
    files = await traverseDirectory(dirHandle);
  } else {
    const win = window as unknown as WindowWithFileSystemAccess;
    if (!win.showOpenFilePicker) {
      throw new Error('showOpenFilePicker is not supported in this browser.');
    }
    const fileHandles: FileSystemFileHandle[] = await win.showOpenFilePicker({ multiple: true });
    files = await Promise.all(
      fileHandles.map(async (handle: FileSystemFileHandle) => ({
        file: await handle.getFile(),
        path: handle.name,
      }))
    );
  }
  return files;
}
