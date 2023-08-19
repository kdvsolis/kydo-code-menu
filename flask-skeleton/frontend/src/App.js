import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';

import ButtonAppBar from "./component/header";

import Main from "./pages/main/main";
import TextGenerator from "./pages/text_generator/text_generator";
import RawResponseGenerator from "./pages/raw_chatgpt/raw_chatgpt";
import UrlScraper from "./pages/url_scraper/url_scraper";
import SocialMediaTool from "./pages/social_media_tool/social_media_tool";
import GoogleAds from "./pages/google_ads/google_ads";
import OnAudit from "./pages/on_audit/on_audit";
import ImageCompressor from "./pages/image_compressor/image_compressor";
import ImageKeyword from "./pages/image_keyword/image_keyword";

function App() {
  return (
    <>
      <ButtonAppBar/>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RawResponseGenerator />}>
          </Route>
          <Route path="/text-generator" element={<TextGenerator />}>
          </Route>
          <Route path="/raw-response-generator" element={<RawResponseGenerator />}>
          </Route>
          <Route path="/url-scraper" element={<UrlScraper />}>
          </Route>
          <Route path="/social-media-tool" element={<SocialMediaTool />}>
          </Route>
          <Route path="/google-ads" element={<GoogleAds />}>
          </Route>
          <Route path="/on-audit" element={<OnAudit />}>
          </Route>
          <Route path="/image-compressor" element={<ImageCompressor />}>
          </Route>
          <Route path="/image-keyword" element={<ImageKeyword />}>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
