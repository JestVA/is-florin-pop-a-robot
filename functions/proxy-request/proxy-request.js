// Docs on event and context https://www.netlify.com/docs/functions/#the-handler-method
exports.handler = async (event, context) => {
  try {
	

	const YT_API_KEY = process.env.YT_API_KEY;
	const GET_CHANNEL_INFO_URL = "https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=UCeU-1X402kT-JlLdAitxSMA&maxResults=50"
	
	// determine if it's a proxy for YouTube or Twitter (ideally run both for now)



	// want to see how they are passed if multiple q strings
	console.log(event.queryStringParameters)

	// ok so they come as object with values as strings --- maybe use Boolean to coerce

	// const subject = event.queryStringParameters.name || 'World'
	
	return {
      statusCode: 200,
      body: JSON.stringify({ message: `Hello Devfrend!` })
      // // more keys you can return:
      // headers: { "headerName": "headerValue", ... },
      // isBase64Encoded: true,
	}
	
  } catch (err) {

	// good to let front end know to display out of quota message
	console.log(err.toString())
    return { statusCode: 500, body: err.toString() }
  }
}
