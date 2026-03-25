// Seolhwa - 메인 JavaScript 파일

function updateYear() {
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
}

function setupNavigation() {
  const navLinks = document.querySelectorAll('nav a');

  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();

      // 링크 active 상태 관리
      navLinks.forEach((nav) => nav.classList.remove('active'));
      link.classList.add('active');

      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') {
        return;
      }

      const targetSection = document.querySelector(targetId);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function setupGridInteraction() {
  const gridItems = document.querySelectorAll('.grid .item');

  gridItems.forEach((item) => {
    item.addEventListener('mouseenter', () => {
      item.style.transform = 'translateY(-4px)';
      item.style.cursor = 'pointer';
    });

    item.addEventListener('mouseleave', () => {
      item.style.transform = 'translateY(0)';
    });

    item.addEventListener('click', () => {
      const title = item.querySelector('strong')?.textContent || '아이템';
      console.log(`그리드 클릭: ${title}`);
      alert(`그리드 항목 선택: ${title}`);
    });
  });
}

function init() {
  updateYear();
  setupNavigation();
  setupGridInteraction();
  console.log('Seolhwa 페이지 초기화 완료');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
