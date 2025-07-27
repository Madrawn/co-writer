"use client";
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
    const dirHandle: FileSystemDirectoryHandle = await (
      window as any
    ).showDirectoryPicker();
    files = await traverseDirectory(dirHandle);
  } else {
    const fileHandles: FileSystemFileHandle[] = await (
      window as any
    ).showOpenFilePicker({ multiple: true });
    files = await Promise.all(
      fileHandles.map(async (handle: FileSystemFileHandle) => ({
        file: await handle.getFile(),
        path: handle.name,
      }))
    );
  }
  return files;
}
