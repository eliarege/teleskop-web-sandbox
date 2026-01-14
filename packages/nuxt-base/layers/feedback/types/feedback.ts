export interface Feedback {
  appName: string
  image: string
  reportType: string
  title: string
  description: string
  browser: {
    name: string
    version: string
    width: number
    height: number
  }
  os: {
    name: string
    version: string
  }
}

export interface FeedbackModel {
  appName: string
  reportType: string
  description: string
  image: string
}
