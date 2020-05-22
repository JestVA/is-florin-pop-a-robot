const getVideoIdsWithPagination = (config) => 
{
	return new Promise((resolve, reject) => 
	{
		// open a HTTP protocol
		const request = new XMLHttpRequest();
		request.open('GET', `${config.URL}${config.API_KEY}`, true);
		request.setRequestHeader('Authorization', `API Key ${config.API_KEY}`);
		request.setRequestHeader('Accept', 'application/json');
		request.addEventListener('load', resolve);
		request.onreadystatechange = function ()
		{
			// uno dos tres quatros 
			if(request.readyState === 4)
			{
				console.log(2);
				return resolve(JSON.parse(request.response));
			}

		}

		request.send();

	});
}