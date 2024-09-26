export async function blobToImage(blobUrl: string): Promise<string> {
  const blob = new Blob([blobUrl])
  return new Promise((resolve, _) => {
    const reader = new FileReader()
    reader.readAsDataURL(blob)
    reader.onloadend = () => resolve(reader.result)
  })
}
