// Docs on event and context https://www.netlify.com/docs/functions/#the-handler-method
exports.handler = async (event, context) => {

	// so happy about this, not exposing my key to Client
	const YT_API_KEY = process.env.YT_API_KEY;
	
	// in the future convert this to be dynamic coming from Client via a form submit
	const FLORIN_POP_CHANNEL = "UCeU-1X402kT-JlLdAitxSMA";
	
	const GET_CHANNEL_INFO_URL = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${FLORIN_POP_CHANNEL}&maxResults=50`;
	

	try 
	{
		// determine if it's a proxy for YouTube or Twitter (ideally run both for now)
		// want to see how they are passed if multiple q strings
		console.log(event.queryStringParameters)
		// ok so they come as object with values as strings --- maybe use Boolean to coerce


		return { statusCode: 200, body: JSON.stringify({ message: `Hello Devfrend!` })};

	} 
	catch(err) 
	{
		// good to let front end know to display out of quota message
		console.log(err.toString())
		return { statusCode: 500, body: err.toString() }
	}
}
