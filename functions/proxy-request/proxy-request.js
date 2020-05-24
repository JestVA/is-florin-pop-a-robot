const axios = require('axios');

exports.handler = async (event, context) => {

	// in the future convert this to be dynamic coming from Client via a form submit
	// so it will check `event.queryStringParameters`
	const FLORIN_POP_CHANNEL = "UCeU-1X402kT-JlLdAitxSMA";
	
	try 
	{
		// run when ready
		const youTubeDuration = await getTotalVideoDurationForChannelLifetimeYT(FLORIN_POP_CHANNEL);

		return { statusCode: 200, body: JSON.stringify({ message: `Hello Devfrend!`, youTubeDuration })};
	} 
	catch(err) 
	{
		if(err.message === "API QUOTA LIMIT REACHED.")
			return { statusCode: 200, body: JSON.stringify({ message: "🤖: Sorry traveller, my API Quota for today was consumed", error: true})};

		return { statusCode: 200, body: JSON.stringify({error: true, message: err.toString()}) };
	}

	// refactor the old XMLHttpRequest
	async function getTotalVideoDurationForChannelLifetimeYT(channelId)
	{
		// so happy about this, not exposing my key to Client
		const YT_API_KEY = process.env.YT_API_KEY;
		// query to get initial channel data and token for next page (YT uses pagination)
		const GET_CHANNEL_INFO_URL = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=50`;
		
		const videoIds = [];

		const requestOptions = {
			headers: {
				'Authorization': `API Key ${YT_API_KEY}`,
				'Accept': 'application/json'
			},
			timeout: 30000 // overwrite default 10 sec
		};

		let initialReq = null;
		let nextPage = null;
		let api_error = null;

		try
		{
			initialReq = await axios.get(`${GET_CHANNEL_INFO_URL}&key=${YT_API_KEY}`, requestOptions);
		}
		catch(err)
		{
			if(err.response.status === 401)
				throw new Error('API QUOTA LIMIT REACHED.');
		}

		
		const { items, nextPageToken } = initialReq.data;
		
		nextPage = nextPageToken;

		videoIds.push(extractIdCollection(items));

		// The API Quota is ridiculous
		while(nextPage && !api_error)
		{
			let getNextPage = null;

			try
			{
				getNextPage = await axios.get(`${GET_CHANNEL_INFO_URL}&pageToken=${nextPage}&key=${YT_API_KEY}`, requestOptions);
			}
			catch(err)
			{
				api_error = true; // my quota was consumed in 10 sec due to this while erroring...
				if(err.response && err.response.status === 401)
					throw new Error('API QUOTA LIMIT REACHED.');
			}
		
			let { items, nextPageToken }  = getNextPage.data;

			videoIds.push(extractIdCollection(items));
			
			if(! nextPageToken)
				nextPage = false;
			else
				nextPage = nextPageToken

		}

		// we have all the video ids at this stage, since begining of channel

		let durationTally = 0;

		// quick and dirty
		for(let i = 0; i < videoIds.length; i++)
		{
			// fetches up to 50 vids at once
			const durationQuery = makeVideoIdQueryString(videoIds[i]);

			let withDuration = null;
			
			try
			{
				withDuration = await axios.get(`${durationQuery}&key=${YT_API_KEY}`, requestOptions);
			}
			catch(err)
			{
				api_error = true;
				
				if(err.response && err.response.status === 401)
					throw new Error('API QUOTA LIMIT REACHED.');
			}

			const { items } = withDuration.data;

			durationTally += items.reduce((a, c) => a += parseDurationString(c.contentDetails.duration), 0);
		};

		// This is YT for now, need to get Twitter as well
		return durationTally;
	}



	// Utility function that is over my league, such a shame there is no native JS date object function to calc duration
	/* https://stackoverflow.com/questions/14934089/convert-iso-8601-duration-with-javascript/29153059 */
	function parseDurationString( durationString ){
		const stringPattern = /^PT(?:(\d+)D)?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d{1,3})?)S)?$/;
		const stringParts = stringPattern.exec( durationString );
		return (
				(
				(
					( stringParts[1] === undefined ? 0 : stringParts[1]*1 )  /* Days */
					* 24 + ( stringParts[2] === undefined ? 0 : stringParts[2]*1 ) /* Hours */
				)
				* 60 + ( stringParts[3] === undefined ? 0 : stringParts[3]*1 ) /* Minutes */
				)
				* 60 + ( stringParts[4] === undefined ? 0 : stringParts[4]*1 ) /* Seconds */
			);
	}

	function extractIdCollection(results = [])
	{
		// we also filter out playlists
		return results.filter(i => i.id.videoId).map(vid => vid.id.videoId);
	}

	function makeVideoIdQueryString(ids = [])
	{
		// joins up to 50 video ids in a string
		return `https://www.googleapis.com/youtube/v3/videos?id=${ids.join(',')}&part=contentDetails`
	}
}







