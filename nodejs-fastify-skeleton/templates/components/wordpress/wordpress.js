import { wordpressService } from '/services/wordpress.service.js';

let wordpress = {
    getQA: async function (search, categories, tags, page=1){
        let query_string = "?";
        if(typeof search != "undefined" && search){
            query_string += query_string != "?"? "&" : "";
            query_string += "search=" + encodeURI(search);
        }
        if(typeof categories != "undefined" && categories){
            query_string += query_string != "?"? "&" : "";
            query_string += "categories=" + categories;
        }
        if(typeof tags != "undefined" && tags){
            query_string += query_string != "?"? "&" : "";
            query_string += "tags=" + tags;
        }
       query_string += query_string != "?"? "&" : "";
       query_string += "page=" + page;
       return wordpressService.getQA(query_string);
    },
    getAllLocations: async function(){
        return await wordpressService.getAllLocations();
    }

}
export { wordpress };