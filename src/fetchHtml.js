// src/fetchHtml.js
export async function fetchHtmlFromUrl(url) {
    try {
      const response = await fetch(`http://localhost:4000/api/fetch-html?url=${encodeURIComponent(url)}`);
      const json = await response.json();
      return json;
    } catch (error) {
      console.error('HTML 가져오기 실패:', error);
      return {};
    }
  }
  