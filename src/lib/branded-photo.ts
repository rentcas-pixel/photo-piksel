/** Creates a download copy; never modifies the stored original. */
export async function createBrandedPhoto(url: string): Promise<{ blob: Blob; extension: string }> {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Nuotrauka nepasiekiama')
  const source = await response.blob()
  const logoResponse = await fetch('/Piksel-logo-baltas-2026.png')
  if (!logoResponse.ok) throw new Error('Logotipas nepasiekiamas')

  const photo = await createImageBitmap(source)
  let logo: ImageBitmap | undefined
  const canvas = document.createElement('canvas')
  try {
    logo = await createImageBitmap(await logoResponse.blob())
    // Scale the strip and logo with the original width, keeping the entire photo.
    const stripHeight = Math.max(1, Math.round(photo.width * 0.06))
    const logoWidth = photo.width * 0.075
    const logoHeight = logoWidth * logo.height / logo.width
    canvas.width = photo.width
    canvas.height = photo.height + stripHeight
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Nepavyko paruošti nuotraukos')
    context.fillStyle = '#000'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(photo, 0, stripHeight)
    context.drawImage(logo, (photo.width - logoWidth) / 2, (stripHeight - logoHeight) / 2, logoWidth, logoHeight)

    const mimeType = source.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(result => result ? resolve(result) : reject(new Error('Nepavyko sukurti failo')), mimeType, 0.95)
    })
    return { blob, extension: blob.type === 'image/png' ? 'png' : 'jpg' }
  } finally {
    photo.close()
    logo?.close()
    canvas.width = 0
    canvas.height = 0
  }
}
