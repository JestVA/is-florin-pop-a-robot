const getVideoIdsWithPagination = (config = false, nextPageToken = false, contentDetails = false) => 
{
	let fetchNextPageQuery = '';
	
	if(nextPageToken)
		fetchNextPageQuery = `&pageToken=${nextPageToken}`;

	return new Promise((resolve, reject) => 
	{
		// open a HTTP protocol
		const request = new XMLHttpRequest();
		if(config)
			// Will fetch Channel with video Ids
			request.open('GET', `${config.URL}${fetchNextPageQuery}&key=${config.API_KEY}`, true);
		else if(contentDetails)
			// Will loop through all videos 50 at a time and fetch things like duration
			request.open('GET', contentDetails, true);
		else
			return reject(false);

		request.setRequestHeader('Authorization', `API Key ${config.API_KEY}`);
		request.setRequestHeader('Accept', 'application/json');
		request.addEventListener('load', resolve);
		request.onreadystatechange = function ()
		{
			// uno dos tres quatros 
			if(request.readyState === 4)
			{
				return resolve(JSON.parse(request.response));
			}
		}
		request.send();
	});
}