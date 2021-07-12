//This file is the main engine for shared functions  to retrieve data from HypothesisHighlightTemplate
;(()=>{
  window.rhHypothesis = {};
  rhHypothesis.userToken    = '';
  rhHypothesis.userProfile  = '';
  rhHypothesis.initialized  = false;
  rhHypothesis.highlightTemplate = 'HIGHLIGHT [->](URL)';
  rhHypothesis.noteTemplate = 'NOTE';
  rhHypothesis.sbButton = '{{=:|#hypothesis}}' +
    '{{📰:42SmartBlock:Hypothes.is - Open site:42RemoveButton=false}}'+
    '{{📑:42SmartBlock:Hypothes.is - Insert my annotations from site in current block:42RemoveButton=false}}';
		
  const apiUrl = 'https://api.hypothes.is/api/';
  const getUserProfile = async ()=> await apiHTTPGet(`${apiUrl}profile`);

  const apiHTTPGet = async (apiCall, data) => {
    const settings = { "url": apiCall, "method": "GET", "async": false, 
                      "headers": { "Authorization": "Bearer " + rhHypothesis.userToken} };
    return $.ajax(settings).done((response) => response);
  } 

  const paginatedAPIGet = async (
    baseURL,
    response_length = 200,
    data = null,
    count = 0
  ) => {
    const url = `${baseURL}&sort=updated&order=asc&limit=${response_length}&offset=${
      count * response_length
    }`;
    const settings = {
      url: `${url}`,
      method: "GET",
      async: false,
      headers: { Authorization: "Bearer " + rhHypothesis.userToken },
    };
    return $.ajax(settings).done((response) => {
      if (data === null){
        data = response
      }
      else {
        data.rows = data.rows.concat(response.rows)   
      }
      if (data.rows.length < response.total) {
        paginatedAPIGet(baseURL, response_length, data, count + 1);
      } else {
        data;
      }
    });
  };
  
  const formatHighlightBasedOnTemplate = (template,highlight,url) =>{
    return template.replace('HIGHLIGHT', highlight.trim())
      			   .replace('URL', url).trim();    
  }

  const formatNoteBasedOnTemplate = (template,note,url) =>{
    return template.replace('NOTE', note.trim())
      			   .replace('URL', url).trim();    
  }
  
  rhHypothesis.insertAnnotions = async (results,undoLastIndent=false, startingUid='')=> { 
    var hTemplate = await roam42.settings.get('HypothesisHighlightTemplate');
    var nTemplate = await roam42.settings.get('HypothesisNoteTemplate');
    if(!hTemplate) hTemplate = rhHypothesis.highlightTemplate;
	if(!nTemplate) nTemplate = rhHypothesis.noteTemplate;
    if(results) {
      if(startingUid=='')
 	     startingUid = document.activeElement.id.slice(-9);
      let currentBlock = 0;
      for(var i=0; i<results.length; i++) {
        var e = results[i];
        var output = '';
        if(e.highlight!='') output += 
          	formatHighlightBasedOnTemplate(hTemplate, e.highlight, e.context);
        output = output.trim();
        if(e.tags.length>0) output += e.tags.map(e=>` #[[${e}]]`).reduce((e,a)=>e+a);
        //output += ` [->](${e.context})`;
        if(i==results.length-1) output += '  '; //last block, need spaces
		let newBlock = await roam42.common.createBlock(startingUid,currentBlock,output);
        currentBlock += 1;
        if(e.text!='') { //insert note
          var textOutput = await formatNoteBasedOnTemplate(nTemplate, e.text, e.context); 
  		  await roam42.common.createBlock(newBlock,0,textOutput);
        }
      }
    }
  }  

  const apiAnnotationSimplify = async (results)=>{
    return results.rows.map(e=>{ 
      var r = { 
        title: e.document.title[0], uri:e.uri, context: e.links.incontext,
        text: e.text, highlight: '', tags: e.tags, 
        user: e.user, group:e.group,  created: e.created, updated: e.updated,  
      };
      try { 
        if(e.target[0].selector) {
          var txt = e.target[0].selector.filter(e=>e.type=='TextQuoteSelector');
          if(txt) r.highlight = txt[0].exact; 
        }
      } catch(e){};
      return r;
    });
  }  
  
  rhHypothesis.getAllAnnotations = async (articleUrl)=> {
	const searchUrl = `search?order=asc&uri=${encodeURIComponent(articleUrl)}`;
	const results = await apiHTTPGet(`${apiUrl}${searchUrl}`);
    return await apiAnnotationSimplify(results);
  }

  rhHypothesis.getMyAnnotations = async (articleUrl)=> {
	const searchUrl = `search?user=${rhHypothesis.userProfile.userid}&order=asc&uri=${encodeURIComponent(articleUrl)}`;
	const results = await paginatedAPIGet(`${apiUrl}${searchUrl}`, 50);
    return await apiAnnotationSimplify(results);
  }

  rhHypothesis.getAnnotationsSinceDateWithTags = async (fromDate,tags)=> {
	const searchUrl = `search?tags=${encodeURIComponent(tags)}&user=${rhHypothesis.userProfile.userid}&sort=updated&order=asc&search_after=${fromDate}`;
	const results = await apiHTTPGet(`${apiUrl}${searchUrl}`); 
    console.log(results)
    return await apiAnnotationSimplify(results);
  }

  
  rhHypothesis.getAnnotationsSinceDate = async (fromDate)=> {
	const searchUrl = `search?user=${rhHypothesis.userProfile.userid}&sort=updated&order=asc&search_after=${fromDate}`;
	const results = await apiHTTPGet(`${apiUrl}${searchUrl}`); 
    console.log(results)
    return await apiAnnotationSimplify(results);
  }
  
  rhHypothesis.openArticleInHypothesis = async (articleUrl)=> {
    window.open('https://via.hypothes.is/' + articleUrl, '_blank');
  }
  
  const initialize = async ()=> {
    rhHypothesis.userToken   = await roam42.settings.get('HypothesisUserToken');
  	rhHypothesis.userProfile = await getUserProfile();
    if(rhHypothesis.userProfile.userid != null) rhHypothesis.initialized = true;
  }
  
	// LOADER Starts here
  var loadingCounter = 0;
  const interval = setInterval( async ()=> {
    if (roam42.keyevents) {
      clearInterval(interval);
	  	roam42.loader.addScriptToPage('linkifyjs', 'https://cdn.jsdelivr.net/npm/linkifyjs@2.1.9/dist/linkify.min.js');      
      await initialize();
    }
    if(loadingCounter>20) { clearInterval(interval) } else {loadingCounter += 1}; 
  }, 5000);  
  

	//This is for convenient reloading of this script in Roam
	window.rhHypothesis.testingReload = ()=>{
		console.log('reloading rhHypothesis')
		roam42.loader.addScriptToPage( 'rhHypothesis', 	'https://hypothesis.roamhacker.repl.co/main.js');
	}

})();