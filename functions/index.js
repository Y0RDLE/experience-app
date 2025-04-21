// functions/index.js

import functions from "firebase-functions";
import puppeteer from "puppeteer";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors({ origin: true }));

app.get("/getNaverPlace", async (req, res) => {
  const name = req.query.name;
  if (!name) return res.status(400).json({ error: "name 파라미터가 필요합니다." });

  try {
    const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
    const page = await browser.newPage();
    const searchUrl = `https://map.naver.com/v5/search/${encodeURIComponent(name)}`;

    await page.goto(searchUrl, { waitUntil: "networkidle0" });
    await page.waitForTimeout(3000);

    const result = await page.evaluate(() => {
      const anchor = document.querySelector("a[href^='https://map.naver.com/v5/entry']");
      return anchor ? anchor.href : null;
    });

    await browser.close();
    if (!result) return res.status(404).json({ error: "결과 없음" });
    res.json({ url: result });
  } catch (err) {
    console.error("🔥 크롤링 실패:", err);
    res.status(500).json({ error: "서버 내부 오류" });
  }
});

// 🔥 반드시 필요함! Firebase Functions 엔드포인트로 내보냄
export const api = functions.https.onRequest(app);