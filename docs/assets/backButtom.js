(function() {
  // 创建样式
  const style = document.createElement('style');
  style.textContent = `
    .back-to-buttom {
      position: fixed;
      bottom: 80px;
      right: 15px;
      background-color: rgba(255, 255, 255, 0.8);
      color: #333;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      width: 50px;
      height: 50px;
      font-size: 30px;
      z-index: 10000;
      transition: transform 0.2s ease, opacity 0.3s ease;
      display: none;
      align-items: center;
      justify-content: center;
    }
    .back-to-buttom:hover {
      transform: scale(1.1);
    }
    .back-to-buttom svg {
      width: 24px;
      height: 24px;
    }
    @media (max-width: 768px) {
      .back-to-buttom {
        width: 40px;
        height: 40px;
        font-size: 20px;
      }
    }
  `;
  document.head.appendChild(style);

  // 创建按钮
  const btn = document.createElement('button');
  btn.className = 'back-to-buttom';
  btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 19V5M5 12l7 7 7 -7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.body.appendChild(btn);

  // 点击事件处理
  btn.addEventListener('click', () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  });

  // 判断到达页面底部
  function isAtBottom() {
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    clientHeight = window.innerHeight;
    scrollHeight = document.body.offsetHeight;
    return (clientHeight + scrollTop) >= scrollHeight - 2;
}

  // 滚动事件处理
  function toggleButtonVisibility() {
      if (isAtBottom() > 0) {
      btn.style.display = 'none';
    } else {
      btn.style.display = 'flex';
    }
  }

  window.addEventListener('scroll', toggleButtonVisibility);
  window.addEventListener('resize', toggleButtonVisibility);

  // 初始检查
  toggleButtonVisibility();
})();
