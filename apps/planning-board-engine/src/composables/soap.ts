export function remoteShowMessageBody(title: string, message: string) {
  return /* xml */`\
<?xml version="1.0"?>
<SOAP-ENV:Envelope
	xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"
	xmlns:xsd="http://www.w3.org/2001/XMLSchema"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/">
	<SOAP-ENV:Body
		xmlns:NS1="urn:tbb6500"
    SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
		<NS1:remoteShowMessage>
			<header>${encodeXML(title)}</header>
			<msg>${encodeXML(message)}</msg>
		</NS1:remoteShowMessage>
	</SOAP-ENV:Body>
</SOAP-ENV:Envelope>`
}

function encodeXML(str: string) {
  return str.replace(/[<>&'"\n]/g, (char) => {
    switch (char) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case '"': return '&quot;'
      case '\'': return '&apos;'
      case '\n': return '&#10;'
      default: return char
    }
  })
}
