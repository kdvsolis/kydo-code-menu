var wordpressService = {
    getQA: async function(search_query){
        return await (await fetch('/qa-search' + search_query)).json();
    },
    getAllLocations: async function(){
        return await (await fetch('/location-all')).json();
    }
}

export { wordpressService }