---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: home
---

<style>
.promo-card {
  border: 2px solid #FFB6C1; /* 可爱的粉色边框 */
  border-radius: 20px; /* 更圆润的边角 */
  padding: 1rem; /* 增加内边距，让内容更舒展 */
  text-align: center;
  max-width: 700px;
  margin: 1rem auto;
  box-shadow: 0 8px 16px rgba(255, 182, 193, 0.4); /* 柔和的粉色阴影 */
  background: #FFF5F7; /* 非常浅的粉色背景 */
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.promo-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(255, 182, 193, 0.6); /* 悬停时阴影加深 */
}
.promo-card h2 {
  margin-top: 0;
  font-size: 1.8rem;
  color: #D90368; /* 深粉色标题，更醒目 */
}
.promo-card p {
  color: #6D6875; /* 柔和的灰色文字 */
  font-size: 1.1rem;
  line-height: 1.6;
}
.promo-button {
  display: inline-block;
  background-color: #FF6F91; /* 可爱的粉色/珊瑚色 */
  color: white;
  padding: 16px 36px; /* 增加内边距，让按钮更大 */
  text-decoration: none;
  border-radius: 30px; /* 更圆润的“药丸”形状 */
  font-weight: bold;
  font-size: 1.2rem; /* 增大字体 */
  margin-top: 0.5rem;
  transition: all 0.3s ease; /* 平滑所有过渡效果 */
  box-shadow: 0 5px 15px rgba(255, 111, 145, 0.4); /* 柔和的同色系阴影 */
  animation: pulse-animation 2s infinite; /* 应用动画 */
  border: none;
}
.promo-button:hover {
  background-color: #FF4A75; /* 悬停时颜色加深 */
  transform: translateY(-4px) rotate(-2deg); /* 俏皮的悬停效果 */
  box-shadow: 0 8px 25px rgba(255, 111, 145, 0.6); /* 悬停时阴影更深 */
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
  <a href="/Dubai-morgage-and-golden-visa/" class="promo-button">✨ 立即咨询与申请 ✨</a>
</div>
