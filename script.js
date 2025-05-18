let isScrolling = false;  // 防止滚动过快触发多次滚动

document.querySelectorAll('.navbar a').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  });
});

document.addEventListener('wheel', function (e) {
  if (isScrolling) return; // 如果正在滚动，避免再次触发滚动

  isScrolling = true; // 设置为正在滚动状态
  e.preventDefault(); // 防止默认滚动行为
  
  if (e.deltaY > 0) {
    // 向下滚动，跳转到下一个页面
    scrollToNextSection();
  } else {
    // 向上滚动，跳转到上一个页面
    scrollToPreviousSection();
  }
  
  // 滚动完成后，恢复状态
  setTimeout(() => {
    isScrolling = false;
  }, 800); // 设置为滚动动画持续的时间
});

function scrollToNextSection() {
  const currentSection = getCurrentSection();
  const nextSection = currentSection.nextElementSibling;
  if (nextSection) {
    nextSection.scrollIntoView({ behavior: 'smooth' });
  }
}

function scrollToPreviousSection() {
  const currentSection = getCurrentSection();
  const previousSection = currentSection.previousElementSibling;
  if (previousSection) {
    previousSection.scrollIntoView({ behavior: 'smooth' });
  }
}

function getCurrentSection() {
  const sections = document.querySelectorAll('.section');
  let currentSection = sections[0];
  
  for (let i = 0; i < sections.length; i++) {
    if (sections[i].getBoundingClientRect().top <= 0) {
      currentSection = sections[i];
    }
  }
  
  return currentSection;
}
