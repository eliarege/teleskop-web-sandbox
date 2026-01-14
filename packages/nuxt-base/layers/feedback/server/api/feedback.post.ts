import { Buffer } from 'node:buffer'
import { readFileSync } from 'node:fs'
import os from 'node:os'
import process from 'node:process'
import prettyBytes from 'pretty-bytes'
import nodemailer, { type SendMailOptions } from 'nodemailer'
import { createError } from 'h3'
import type { Feedback } from '../../types/feedback'

// TODO: Body validation
export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = event.context.kauth

  if (!token) {
    console.error('Authentication should be able to send feedback.')
    throw createError({
      statusCode: 500,
      data: {
        code: 'no-auth',
        message: 'User not authenticated',
      },
    })
  }
  if (!config.smtpUser || !config.smtpPassword || !config.serviceDeskEmail) {
    console.error('SMTP should be configured to be able to send feedback.')
    throw createError({
      statusCode: 500,
      data: {
        code: 'not-configured',
        message: 'SMTP should be configured.',
      },
    })
  }
  if (!token.email || !token.email_verified) {
    throw createError({
      statusCode: 400,
      data: {
        code: 'email-not-verified',
        message: 'E-Mail has to be verified.',
      },
    })
  }

  const feedback = await readBody(event) as Feedback

  if (feedback.image && !isValidBase64(feedback.image)) {
    throw createError({
      statusCode: 400,
      data: {
        code: 'bad-image',
        message: 'Invalid image format. Expected base64.',
      },
    })
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPassword,
    },
  })

  let subject = `[${feedback.reportType}] [${feedback.appName}] ${feedback.title}`
  if (config.customerName) {
    subject = `[${config.customerName}] ${subject}`
  }

  const mailOptions: SendMailOptions = {
    from: config.smtpUser,
    to: config.serviceDeskEmail,
    subject,
    replyTo: token.email,
    text: `
## 👤 Reporter

- **Name:** ${token.name}
- **Email:** ${token.email}
- **Customer/Company:** ${config.customerName}

## 🏡 Environment

### App Info
- **Name:** ${feedback.appName}
- **Version:** ${config.twVersion}
- **Build Date:** ${config.twBuildDate}
- **Commit Hash:** ${config.twCommitHash}

### Browser Info
- **Name:** ${feedback.browser.name}
- **Version:** ${feedback.browser.version}
- **Window Resolution:** ${feedback.browser.width} x ${feedback.browser.height}

### Client Operating System
- **Name:** ${feedback.os.name}
- **Version:** ${feedback.os.version}

### Server Operating System
- **Name:** ${os.type()}
- **Version:** ${os.version()}
- **Architecture:** ${os.arch()}
- **CPU:** ${getCpuInfo()}
- **Memory:** ${getMemory()}

## 📝 Description

${feedback.description}
  `,
  }

  // Attach image
  if (feedback.image) {
    const timestamp = new Date().toISOString()
    let filename = `${feedback.appName}_${timestamp}.png`
    if (config.customerName) {
      filename = `screenshot_${config.customerName.toLowerCase()}_${filename}`
    } else {
      filename = `screenshot_${filename}`
    }

    mailOptions.text += `\n## 📸 Screenshot`
    mailOptions.attachments = [
      {
        filename,
        content: feedback.image,
        encoding: 'base64',
      },
    ]
  }

  try {
    await transporter.sendMail(mailOptions)
    return 'OK'
  } catch (error) {
    throw createError({
      statusCode: 500,
      data: {
        code: 'send-fail',
        message: 'Failed to send email',
      },
    })
  }
})

function isValidBase64(str: string) {
  try {
    return Buffer.from(str, 'base64').toString('base64') === str
  } catch (error) {
    return false
  }
}

function getMemory(): string {
  const memory = process.constrainedMemory() || os.totalmem()
  return prettyBytes(memory, { binary: true })
}

function getCpuInfo(): string {
  const cpus = os.cpus()
  if (cpus.length) {
    return `${cpus[0].model} (Core: ${getCpuCores()})`
  } else {
    return ''
  }
}

function getCpuCores() {
  try {
    const quota = readFileSync('/sys/fs/cgroup/cpu/cpu.cfs_quota_us', 'utf8')
    const period = readFileSync('/sys/fs/cgroup/cpu/cpu.cfs_period_us', 'utf8')
    const cores = Math.ceil(Number.parseInt(quota) / Number.parseInt(period))
    return cores > 0 ? cores : os.cpus().length
  } catch (err) {
    console.error('Failed to read cgroup CPU limits:', err)
    return os.cpus().length
  }
}
