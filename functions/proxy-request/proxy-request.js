const axios = require('axios');
const request = require('request');

exports.handler = async (event, context) => {

	// in the future convert this to be dynamic coming from Client via a form submit
	// so it will check `event.queryStringParameters`
	const FLORIN_POP_CHANNEL = "UCeU-1X402kT-JlLdAitxSMA";
	const FLORIN_POP_TWITTER = "florinpop1705";
	
	try 
	{
		// run when ready
		const youTubeDuration = await getTotalVideoDurationForChannelLifetimeYT(FLORIN_POP_CHANNEL);
		const twitterCount = await getTwitterDuration(FLORIN_POP_TWITTER);

		return { statusCode: 200, body: JSON.stringify({ message: `Hello Devfrend!`, youTubeDuration, twitterCount })};
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

	async function getTwitterDuration(user)
	{
		const credentials = `${process.env.TWITTER_API_KEY}:${process.env.TWITTER_API_SECRET}`;
		const credentialsEncoded = Buffer.from(credentials).toString('base64');

		// finally! Axios does not make it easy, with 1st obj being data and second being config
		// I was doing it the other way around like in the GET version...
		const auth = await axios.post('https://api.twitter.com/oauth2/token', {}, {
			headers: {
				'Authorization': `Basic ${credentialsEncoded}`,
				'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
			},
			transformRequest: [(data, header) => {
				data = 'grant_type=client_credentials';
				return data;
			}]
		})

		const bearerToken = auth.data.access_token;
		
		

		
		const getUserDetails = await axios.get(`https://api.twitter.com/1.1/users/show.json?screen_name=${user}`, {
			headers: {
				'authorization': `Bearer ${bearerToken}`
			}
		});

		
		return getUserDetails.data.statuses_count;
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







