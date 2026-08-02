const MAX_SOURCE_BYTES = 4 * 1024 * 1024
const OUTPUT_SIZE = 160

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('无法读取图片'))
    image.src = source
  })
}

export async function readIconFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('请选择图片文件')
  if (file.size > MAX_SOURCE_BYTES) throw new Error('图片不能超过 4MB')

  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })

  const image = await loadImage(source)
  const canvas = document.createElement('canvas')
  canvas.width = OUTPUT_SIZE
  canvas.height = OUTPUT_SIZE
  const context = canvas.getContext('2d')
  if (!context) throw new Error('浏览器不支持图片处理')

  context.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
  const scale = Math.min(OUTPUT_SIZE / image.naturalWidth, OUTPUT_SIZE / image.naturalHeight)
  const width = image.naturalWidth * scale
  const height = image.naturalHeight * scale
  context.drawImage(image, (OUTPUT_SIZE - width) / 2, (OUTPUT_SIZE - height) / 2, width, height)

  try {
    return canvas.toDataURL('image/webp', 0.9)
  } catch {
    return canvas.toDataURL('image/png')
  }
}
