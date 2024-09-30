import { sleep } from './base'

export async function waitForFocus(result: MediaStream): Promise<MediaStream> {
  await sleep()
  if (document.hasFocus()) {
    return result
  }
  return waitForFocus(result)
}
export function mediaDevicesAvailable() {
  return Boolean(navigator.mediaDevices?.getDisplayMedia)
}

export function stopCapture(video: HTMLVideoElement) {
  // @ts-expect-error because getTracks is very much valid in modern browsers
  const tracks = video.srcObject?.getTracks()
  tracks?.forEach((track: { stop: () => void }) => track.stop())

  video.srcObject = null
  video.remove()
}

export function paintVideoFrameOnCanvas(video: HTMLVideoElement) {
  // @ts-expect-error because getTracks is very much valid in modern browsers
  const videoTrackSettings = video.srcObject?.getTracks()[0].getSettings()

  const canvas = document.createElement('canvas')
  canvas.width = videoTrackSettings?.width ?? 0
  canvas.height = videoTrackSettings?.height ?? 0
  const ctx = canvas.getContext('2d')
  ctx?.drawImage(video, 0, 0)

  return canvas
}

export function createVideoElementToCaptureFrames(mediaStream: MediaStream) {
  const video = document.createElement('video')
  video.autoplay = true
  video.muted = true
  video.playsInline = true
  video.srcObject = mediaStream
  video.setAttribute(
    'style',
    'position:fixed;top:0;left:0;pointer-events:none;visibility:hidden;',
  )

  return video
}

interface Options {
  quality?: 0 | 1
  onCaptureStart?: () => Promise<void>
  onCaptureEnd?: () => Promise<void>
  type?: 'image/jpeg' | 'image/png' | 'image/webp'
}
export async function takeScreenshot({
  onCaptureEnd,
  onCaptureStart,
  quality = 1,
  type = 'image/jpeg',
}: Options = {}) {
  return navigator.mediaDevices
    .getDisplayMedia({
    // @ts-expect-error This is actually supported, but only in Chrome so not yet part of the TS typedefs, so
      preferCurrentTab: true,
      video: { frameRate: 30 },
    })
    .then(waitForFocus) // We can only proceed if our tab is in focus.
    .then(async (result) => {
      const video = createVideoElementToCaptureFrames(result)
      await onCaptureStart?.()
      document.body.appendChild(video)

      await sleep()

      const canvas = paintVideoFrameOnCanvas(video)
      const screenshot = canvas.toDataURL(type, quality)

      stopCapture(video)
      canvas.remove()
      await onCaptureEnd?.()

      return screenshot
    })
}
