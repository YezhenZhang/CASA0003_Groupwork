// 替代 wheel 控制的 IntersectionObserver 逻辑
const indicators = document.querySelectorAll('.indicator');
const sections = document.querySelectorAll('.section');

// 使用 IntersectionObserver 监测页面滚动
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      updateIndicators(entry.target.id);
    }
  });
}, {
  threshold: 0.6 // 60% 出现在视口内才触发
});

// 初始化观察
sections.forEach(section => observer.observe(section));

// 小圆点点击滚动功能
document.querySelectorAll('.indicator').forEach(indicator => {
  indicator.addEventListener('click', function () {
    const targetId = this.getAttribute('data-target');
    const targetSection = document.querySelector(`#${targetId}`);
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// 高亮当前页面对应的点
function updateIndicators(currentSectionId) {
  document.querySelectorAll('.indicator').forEach(indicator => {
    if (indicator.getAttribute('data-target') === currentSectionId) {
      indicator.classList.add('active');
    } else {
      indicator.classList.remove('active');
    }
  });
}

// 初始化时高亮正确的点
window.addEventListener('load', () => {
  const activeSection = Array.from(sections).find(sec => {
    const rect = sec.getBoundingClientRect();
    return rect.top <= window.innerHeight * 0.5 && rect.bottom >= window.innerHeight * 0.5;
  });
  if (activeSection) updateIndicators(activeSection.id);
});
