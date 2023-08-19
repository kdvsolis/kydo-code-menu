import api_fetch from "../util/api_fetch";

const text_generator = {
    generateText: async function(main_sentence, input){
        return (await api_fetch.post("/api/generate-text", {}, {}, "", {
            "main_sentence": main_sentence,
            "input": input
        })).json();
    },
    seoAnalyze: async function(request){
        return (await api_fetch.post("/api/scrape-search", {}, {}, "", request)).json();
    },
    generateRawResponse: async function(main_sentence){
        return (await api_fetch.post("/api/generate-raw-response", {}, {}, "", {
            "main_sentence": main_sentence
        })).json();
    },
    urlScraper: async function(url){
        return (await api_fetch.post("/api/scrape-url", {}, {}, "", {
            "url": url
        })).json();
    },
    imageDescribe: async function(url){
        return (await api_fetch.post("/api/describe-image", {}, {}, "", {
            "url": url
        })).json();
    },
    imageKeyword: async function(url,keyword){
        return (await api_fetch.post("/api/img-to-keyword", {}, {}, "", {
            "url": url,
            "keyword": keyword
        })).json();
    },
    onAudit: async function(url, keyword){
        return (await api_fetch.post("/api/onpage-audit", {}, {}, "", {
            "url": url,
            "keyword": keyword
        })).json();
    },
    imageCompressable: async function(url, public_id){
        return (await api_fetch.post("/api/upload-cloudinary", {}, {}, "", {
            "url": url,
            "public_id": public_id
        })).json();
    },
}

export default text_generator;