---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: home
---

<style>
.promo-card {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  max-width: 700px;
  margin: 3rem auto;
  box-shadow: 0 6px 12px rgba(0,0,0,0.08);
  background: #ffffff;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.promo-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.12);
}
.promo-card h2 {
  margin-top: 0;
  font-size: 1.8rem;
  color:rgb(0, 0, 0);
}
.promo-card p {
  color: #555;
  font-size: 1.1rem;
  line-height: 1.6;
}
.promo-button {
  display: inline-block;
  background-color:rgb(255, 255, 255); /* Professional Blue */
  color: white;
  padding: 16px 36px; /* 增加内边距，让按钮更大 */
  text-decoration: none;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1.2rem; /* 增大字体 */
  margin-top: 1.5rem;
  transition: all 0.3s ease; /* 平滑所有过渡效果 */
  box-shadow: 0 5px 15px rgba(0, 120, 212, 0.4); /* 添加更明显的阴影 */
  animation: pulse-animation 2s infinite; /* 应用动画 */
}
.promo-button:hover {
  background-color: #005a9e; /* Darker Blue */
  transform: translateY(-3px); /* 鼠标悬停时轻微上浮 */
  box-shadow: 0 8px 25px rgba(0, 120, 212, 0.5); /* 悬停时阴影更深 */
  animation-play-state: paused; /* 鼠标悬停时暂停动画 */
}

/* 定义脉冲动画 */
@keyframes pulse-animation {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}
</style>

<div class="promo-card">
  <h2>迪拜房屋贷款与黄金签证办理</h2>
  <p>提供一站式专业服务，助您轻松办理迪拜房产按揭和黄金签证。流程透明，高效可靠，即刻开启您在迪拜的全新生活。</p>
  <a href="/Dubai-morgage-and-golden-visa/" class="promo-button">立即咨询与申请</a>
</div>
