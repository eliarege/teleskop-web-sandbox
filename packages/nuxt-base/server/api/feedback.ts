import nodemailer from 'nodemailer'
import type { SendMailOptions } from 'nodemailer'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const feedbackBody = {
    ...body,
    app: {
      name: body.app.name,
      version: config.twVersion,
      buildDate: config.twBuildDate,
      commitHash: config.twCommitHash,
    },
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  })
  const mailOptions: SendMailOptions = {
    from: config.smtpUser,
    to: config.feedbackMail,
    subject: `${feedbackBody.reportType}: ${feedbackBody.app.name}`,
    attachments: [
      {
        filename: 'screenshot.png',
        content: feedbackBody.image,
        encoding: 'base64',
      },
    ],
    text: `
**Date**: ${new Date()}

#### 👤 User Information
- **Username:** ${feedbackBody.username}
- **Email:** ${feedbackBody.email}

#### 💻 Application Information
- **Name:** ${feedbackBody.app.name}
- **Version:** ${feedbackBody.app.version}
- **Build Date:** ${feedbackBody.app.buildDate}
- **Commit Hash:** ${feedbackBody.app.commitHash}

#### 🌐 Browser Information
- **Browser Name:** ${feedbackBody.browser.name}
- **Browser Version:** ${feedbackBody.browser.version}
- **Resolution:** ${feedbackBody.browser.width} x ${feedbackBody.browser.height}

#### 🖥️ Operating System Information
- **OS Name:** ${feedbackBody.os.name}
- **OS Version:** ${feedbackBody.os.version}

#### 📝 Description
> ${feedbackBody.description}

${feedbackBody.image ? '#### 📸 Screenshot' : ''}
      `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { status: 'success', message: 'succesful' }
  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: 'sent-fail' })
  }
})
