console.log('loading script');
const apiUrl = 'https://api.hypothes.is/api/';

const userToken = '6879-x59c5GiaKR5AEWk9LW_FPtO9awnsyRvUu1zxeLct4Y8';

$( document ).ajaxError(function(req) {
	console.log(req)
});


const apiHTTPGet = async (apiCall, data) => {
console.log(apiCall)    	
  const settings = { "url": apiCall, "method": "GET", "async": false, 
                    "headers": { "Authorization": "Bearer " + userToken} };
  return $.ajax(settings).done((response) => response);
}  

(async () => {

 	const getMyAnnotationsByTag= async (tags,fromDate)=> {
		const searchUrl = `search?user=kunicki&tags=${tags}&sort=`;
		console.log(searchUrl)
		const results = await apiHTTPGet(`${apiUrl}${searchUrl}`);
	  return results;
  }

	var results = await getMyAnnotationsByTag('tag1')
	console.log(results)

  // const apiAnnotationSimplify = async (results)=>{
	// 	return results.rows.map(e=>{ 
	// 		var r = { 
	// 				title: e.document.title[0], uri:e.uri, context: e.links.incontext,
	// 				text: e.text, highlight: '', tags: e.tags, 
	// 				user: e.user, group:e.group,  created: e.created, updated: e.updated,  
	// 		};
	// 		try{
	// 			if(e.target[0].selector) {
	// 				var txt = e.target[0].selector.filter(e=>e.type=='TextQuoteSelector');
	// 				if(txt) r.highlight = txt[0].exact; 
	// 				console.log(r.highlight)
	// 			}
	// 		} catch(e){};
	// 		return r;
	// 	});    
  // }


})();

