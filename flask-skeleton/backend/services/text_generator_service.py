from urllib.parse import urlparse
from util.openai import text_generator
from util.google_serp import search_with_serp
from util.scrape import scrape_website, scrape_and_find_property, scrape_and_find_text, get_sizes, num_apperances_of_tag
from util.cloudinary import upload_cloudinary, upload_file_cloudinary

def generate_text(request):
    data = request.json
    main_sentence = data.get("main_sentence")
    texts = data.get("input").split('\n')
    resp = []
    for val in texts:
        txt = main_sentence.replace("%kw%", val)
        print(main_sentence,"----",txt,"---",val,"---")
        resp.extend(text_generator(txt, split=True))
    resp = [i for i in resp if i]
    return resp

def generate_raw_response(request):
    data = request.json
    main_sentence = data.get("main_sentence")
    return {
        "result": text_generator(main_sentence, split=False)
    }

def scrape_search(request):
    data = request.json
    response = []
    serp_response = search_with_serp(
            q=data.get("q"), 
            location=data.get("location", ""),
            domain=data.get("domain", ""), 
            gl=data.get("gl", "us"), 
            hl=data.get("hl", "en"), 
            resultFormat=data.get("resultFormat", "json"),
            pageSize=data.get("pageSize", "100"), 
            pageNumber=data.get("pageNumber", "1")
        )
    title_ranking = "Rank the following SEO titles:"
    description_ranking = "Rank the following SEO description:" # and give an output in raw array of strings
    better_title_ranking = "Give a better SEO title for the following:" # in raw array form than
    better_description_ranking = "Give a better SEO description for the following:"

    titles = []
    better_titles = []
    i = 1
    for result in serp_response["organic_results"]:
        title_ranking = f"{title_ranking}\n{i}. {result['title']}"
        description_ranking = f"{description_ranking}\n{i}. {result['description']}"
        i = i + 1

    titles = text_generator(title_ranking)
    better_titles = text_generator(title_ranking.replace("Rank the following SEO titles:", better_title_ranking))
    descriptions = text_generator(description_ranking)
    better_descriptions = text_generator(description_ranking.replace("Rank the following SEO description:", better_description_ranking))

    response = [{
        "title": "SEO Title Ranking",
        "description": titles
    }, {
        "title": "Suggested SEO Titles",
        "description": better_titles
    }, {
        "title": "SEO Description Ranking",
        "description": descriptions
    }, {
        "title": "Suggested SEO Descriptions",
        "description": better_descriptions
    }]
    return response

def scrape_urls(request):
    data = request.json
    url = data.get("url")
    url_list = scrape_website(url, "a")
    result = []
    for link in url_list:
        if link.has_attr('href'):
            result.append({
                "url": link['href'],
                "text": link.string
            })
    return {
        "result": result
    }

def scrape_property(request):
    data = request.json
    url = data.get("url")
    keyword = data.get("keyword").lower()
    dashed_keyword = keyword.replace(" ","-")
    meta_title = scrape_and_find_property(url, "meta", "og:title")
    meta_description = scrape_and_find_property(url, "meta", "og:description")
    meta_url = scrape_and_find_property(url, "meta", "og:url")
    article_title = scrape_website(url, "h1").string
    secondary_title = scrape_website(url, "h2").string
    images = scrape_website(url, "img")
    img_array = []
    all_has_alt = True
    keyword_in_alt = False
    keyword_in_filename = False
    larger_than_100kb = False
    count_h1 = num_apperances_of_tag(url, "h1")

    for image in images:
        if image.has_attr('alt') == False or image['alt'].lower() == "":
            all_has_alt = False
        elif image['alt'].lower().find(keyword):
            img_array.append(image['alt'].split("/")[-1])
            keyword_in_alt = True
        if image['src'].split('/')[-1].split('.')[0].find(dashed_keyword):
            keyword_in_filename = True
        if get_sizes(image['src']) > 100000:
            larger_than_100kb = True

    return {
        "metaTitleKeyword": meta_title,
        "isKeywordInURL": url.lower().find(dashed_keyword) > -1,
        "isKeywordInMetaTitle": meta_title.lower().find(keyword) > -1,
        "metaTitleLength": len(meta_title),
        "metaDescriptionLength": len(meta_description),
        "isKeywordInMetaDescription": meta_description.lower().find(keyword) > -1,
        "isKeywordInArticleTitle": article_title.find(keyword) > -1,
        "isKeywordInMetaURL": meta_url.find(dashed_keyword) > -1,
        "h1Title": article_title,
        "h2Title": secondary_title,
        "h1Count": count_h1,
        "keywordInFilename": keyword_in_filename,
        "hasImageGreaterThan100": larger_than_100kb,
        "allImgHasALT": all_has_alt,
        "keywordInALT": keyword_in_alt,
        "imgArray": img_array,
        "inBody": len(scrape_and_find_text(url, keyword)) > 0
    }

def upload_image(request):
    data = request.json
    url = data.get("url")
    public_id = data.get("public_id").lower()
    return upload_cloudinary(url, public_id)

def upload_file_image(request):
    file_to_upload = request.files['file']
    return upload_file_cloudinary(file_to_upload)
