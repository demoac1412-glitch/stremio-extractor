const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/extract', async (req, res) => {
  const embedUrl = req.query.url;
  if (!embedUrl) return res.status(400).json({ error: 'Missing url parameter' });

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    
    // Giả lập User-Agent của trình duyệt thật
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36');

    let m3u8Url = null;

    // Lắng nghe các request mạng để tìm link .m3u8
    page.on('request', request => {
      const url = request.url();
      if (url.includes('.m3u8') && !m3u8Url) {
        m3u8Url = url;
      }
    });

    // Mở trang web nhúng
    await page.goto(embedUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Đợi thêm 5 giây để video load và gọi API lấy link
    await new Promise(r => setTimeout(r, 5000));

    await browser.close();

    if (m3u8Url) {
      res.json({ m3u8: m3u8Url });
    } else {
      res.status(404).json({ error: 'M3U8 not found' });
    }
  } catch (error) {
    if (browser) await browser.close();
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Extractor running on port ${PORT}`));
