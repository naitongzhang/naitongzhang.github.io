---
title: 方舟计划 - Arkplan
layout: page
---

<style>
  .highlight { background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 15px 0; }
  .article-grid { display: flex; flex-direction: column; gap: 15px; margin: 20px 0; }
  .article-card { border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; transition: all 0.3s; cursor: pointer; background: #f8f9fa; }
  .article-card:hover { box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2); background: #fff; border-color: #667eea; }
  .article-card a { text-decoration: none; color: inherit; display: grid; gap: 10px; }
  .article-card h3 { margin: 0; color: #667eea; font-size: 18px; }
  .article-card .preview { margin: 0; color: #555; font-size: 14px; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
  .article-card .preview-note { font-size: 12px; color: #999; margin: 0; font-style: italic; }
  .exchange-rate-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px 12px; border-radius: 6px; margin: 10px 0; display: inline-block; font-size: 13px; }
  .rate-item { display: flex; align-items: center; gap: 8px; }
  .rate-label { font-weight: 500; }
  .rate-value { font-weight: bold; }
</style>

# 方舟计划：迪拜移民全指南

<div class="highlight">
  您的迪拜移民之旅起点。从房产投资到黄金签证，我们为您提供全方位指导。
</div>

## 💱 实时汇率

<div class="exchange-rate-box" id="exchangeRateBox">
  <div class="rate-item">
    <div class="rate-label">💱 1 AED =</div>
    <div class="rate-value" id="rateValue">2.73 CNY</div>
  </div>
</div>

<script>
  async function fetchExchangeRateWithTimeout(url, timeout = 3000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  async function fetchExchangeRates() {
    const apis = [
      'https://api.exchangerate-api.com/v4/latest/AED',
      'https://api.exchangerate.host/latest?base=AED',
      'https://open.er-api.com/v6/latest/AED'
    ];
    
    for (let url of apis) {
      try {
        const data = await fetchExchangeRateWithTimeout(url);
        let cny = null;
        
        if (data.rates?.CNY) cny = data.rates.CNY;
        else if (data.conversion_rates?.CNY) cny = data.conversion_rates.CNY;
        
        if (cny) {
          document.getElementById('rateValue').textContent = `${cny.toFixed(2)} CNY`;
          return;
        }
      } catch (error) {
        console.log(`API ${url} 失败:`, error.message);
        continue;
      }
    }
    
    console.log('所有API均失败，使用默认值');
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(fetchExchangeRates, 500);
    });
  } else {
    setTimeout(fetchExchangeRates, 500);
  }
  
  setInterval(fetchExchangeRates, 1800000);
</script>

## 📚 方舟计划系列文章

<div class="article-grid">
  {% assign sorted_articles = site.arkplan | sort: 'order' %}
  {% for article in sorted_articles %}
    <div class="article-card">
      <a href="{{ article.url | relative_url }}">
        <h3>{{ article.title }}</h3>
        <div class="preview">
          {{ article.content | strip_html | truncate: 120 }}
        </div>
        <div class="preview-note">→ 阅读全文</div>
      </a>
    </div>
  {% endfor %}
</div>

## 🚀 快速导航

1. **🌟 迪拜简介** - 了解迪拜的优势和机制
2. **🏠 房产投资** - 学习房产投资的全流程
3. **✨ 签证指南** - 探索各种居留签证选项
4. **📊 数据分析** - 查看市场数据和趋势
5. **💼 成功案例** - 学习真实的成功故事
6. **🏛️ 政府资源** - 访问官方资源和部门

## 📞 联系我们

如果您对迪拜移民感兴趣，请随时联系：

- 📧 邮箱：naitong.zhang@outlook.com
- 📱 微信：zhangnaitong
- 🌐 网站：[迪拜房屋贷款与黄金签证办理]({{ '/Dubai-morgage-and-golden-visa/' | relative_url }})

---

*本文内容仅供参考，具体政策以官方最新规定为准。建议咨询专业顾问获取个性化建议。*
