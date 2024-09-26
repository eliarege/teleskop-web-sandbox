export function getBrowserInfo(userAgent: string) {
  let name = 'Unknown'
  let version = 'Unknown'

  if (/firefox\/\d+/i.test(userAgent)) {
    name = 'Firefox'
    version = userAgent.match(/firefox\/(\d+\.\d+)/i)?.[1] || ''
  } else if (/chrome\/\d+/i.test(userAgent) && !/edg\//i.test(userAgent)) {
    name = 'Chrome'
    version = userAgent.match(/chrome\/(\d+\.\d+)/i)?.[1] || ''
  } else if (/edg\/\d+/i.test(userAgent)) {
    name = 'Edge'
    version = userAgent.match(/edg\/(\d+\.\d+)/i)?.[1] || ''
  } else if (/safari\/\d+/i.test(userAgent) && !/chrome\/\d+/i.test(userAgent)) {
    name = 'Safari'
    version = userAgent.match(/version\/(\d+\.\d+)/i)?.[1] || ''
  } else if (/opr\/\d+/i.test(userAgent)) {
    name = 'Opera'
    version = userAgent.match(/opr\/(\d+\.\d+)/i)?.[1] || ''
  } else if (/msie \d+/i.test(userAgent)) {
    name = 'Internet Explorer'
    version = userAgent.match(/msie (\d+\.\d+)/i)?.[1] || ''
  } else if (/trident\/\d+/i.test(userAgent)) {
    name = 'Internet Explorer'
    version = userAgent.match(/rv:(\d+\.\d+)/i)?.[1] || ''
  }

  return { name, version }
}

export function getOSInfo(userAgent: string) {
  let name = 'Unknown'
  let version = 'Unknown'

  if (/windows nt 10.0/i.test(userAgent)) {
    name = 'Windows'
    version = '10'
  } else if (/windows nt 6.3/i.test(userAgent)) {
    name = 'Windows'
    version = '8.1'
  } else if (/windows nt 6.2/i.test(userAgent)) {
    name = 'Windows'
    version = '8'
  } else if (/windows nt 6.1/i.test(userAgent)) {
    name = 'Windows'
    version = '7'
  } else if (/windows nt 6.0/i.test(userAgent)) {
    name = 'Windows'
    version = 'Vista'
  } else if (/windows nt 5.1/i.test(userAgent)) {
    name = 'Windows'
    version = 'XP'
  } else if (/mac os x (\d+[\._]\d+)/i.test(userAgent)) {
    name = 'Mac OS'
    version = userAgent.match(/mac os x (\d+[\._]\d+)/i)?.[1].replace('_', '.') || ''
  } else if (/android (\d+[\._]\d+)/i.test(userAgent)) {
    name = 'Android'
    version = userAgent.match(/android (\d+[\._]\d+)/i)?.[1] || ''
  } else if (/iphone os (\d+[\._]\d+)/i.test(userAgent)) {
    name = 'iOS'
    version = userAgent.match(/iphone os (\d+[\._]\d+)/i)?.[1].replace('_', '.') || ''
  } else if (/linux/i.test(userAgent)) {
    name = 'Linux'
    version = 'Unknown'
  }

  return { name, version }
}
