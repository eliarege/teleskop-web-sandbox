import nodemailer from 'nodemailer'
import type { Feedback } from '~/types'

// TODO: Body validation
export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = event.context.kauth

  if (!token) {
    console.error('Authentication should be able to send feedback.')
    throw createError({
      statusCode: 500,
      message: 'no-auth',
    })
  }
  if (!config.smtpUser || !config.smtpPassword || !config.serviceDeskEmail) {
    console.error('SMTP should be configured to be able to send feedback.')
    throw createError({
      statusCode: 500,
      message: 'not-configured',
    })
  }
  if (!token.email || !token.email_verified) {
    throw createError({
      statusCode: 400,
      message: 'email-not-verified',
    })
  }

  const feedback = await readBody(event) as Feedback

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPassword,
    },
  })

  const mailContent = `
#### 📅 Date

${new Date().toISOString()}

#### 👤 User Information
- **Username:** ${token.name}
- **Email:** ${token.email}

#### 💻 Application Information
- **Name:** ${token.appName}
- **Version:** ${config.twVersion}
- **Build Date:** ${config.twBuildDate}
- **Commit Hash:** ${config.twCommitHash}

#### 🌐 Browser Information
- **Browser Name:** ${feedback.browser.name}
- **Browser Version:** ${feedback.browser.version}
- **Resolution:** ${feedback.browser.width} x ${feedback.browser.height}

#### 🖥️ Operating System Information
- **OS Name:** ${feedback.os.name}
- **OS Version:** ${feedback.os.version}

#### 📝 Description

${feedback.description}

${feedback.image ? '#### 📸 Screenshot' : ''}
  `

  try {
    await transporter.sendMail({
      from: config.smtpUser,
      to: config.serviceDeskEmail,
      subject: `${feedback.reportType}: ${feedback.appName}`,
      attachments: [
        {
          filename: 'screenshot.png',
          content: feedback.image,
          encoding: 'base64',
        },
      ],
      text: mailContent,
      replyTo: token.email,
    })
    return 'OK'
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'send-fail',
    })
  }
})
