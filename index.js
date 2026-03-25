// Seolhwa - 메인 JavaScript 파일

/**
 * DOM 요소 선택
 */
const navLinks = document.querySelectorAll('nav a');
const gridItems = document.querySelectorAll('.grid .item');
const yearSpan = document.getElementById('year');

/**
 * 현재 연도 자동 업데이트
 */
function updateYear() {
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
}

/**
 * 네비게이션 링크 활성화 상태 관리
 */
function setupNavigation() {
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // 모든 링크에서 활성 상태 제거
      navLinks.forEach(nav => nav.classList.remove('active'));
      
      // 클릭한 링크에 활성 상태 추가
      link.classList.add('active');
      
      // 링크의 텍스트로 스크롤 또는 동작 (데모용)
      const text = link.textContent;
      console.log(`${text} 링크 클릭됨`);
      
      // 부드러운 스크롤 효과 (옵션)
      window.scrollTo({ behavior: 'smooth', top: 0 });
    });
  });
}

/**
 * 그리드 아이템 상호작용
 */
function setupGridInteraction() {
  gridItems.forEach((item) => {
    // 호버 효과 및 클릭 이벤트
    item.addEventListener('mouseenter', () => {
      item.style.transform = 'translateY(-4px)';
      item.style.cursor = 'pointer';
    });
    
    item.addEventListener('mouseleave', () => {
      item.style.transform = 'translateY(0)';
    });
    
    item.addEventListener('click', () => {
      const title = item.querySelector('strong');
      if (title) {
        console.log(`선택됨: ${title.textContent}`);
        // 여기에 추가 기능을 구현할 수 있습니다
      }
    });
  });
}

/**
 * 부드러운 스크롤 동작 설정
 */
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      
      // "#"만 있는 경우 또는 빈 해시인 경우 무시
      if (href === '#' || href === '') {
        return;
      }
      
      e.preventDefault();
      const target = document.querySelector(href);
      
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/**
 * 페이지 초기화
 */
function init() {
  console.log('Seolhwa 페이지 초기화 중...');
  updateYear();
  setupNavigation();
  setupGridInteraction();
  setupSmoothScroll();
  console.log('초기화 완료!');
}

/**
 * DOM 로드 완료 후 초기화 실행
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/**
 * 유틸리티: 현재 시간 표시 (선택사항)
 */
function displayCurrentTime() {
  const timeElement = document.createElement('div');
  timeElement.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 10px 15px;
    border-radius: 8px;
    font-size: 12px;
    font-family: monospace;
    z-index: 9999;
  `;
  
  function updateTime() {
    const now = new Date();
    timeElement.textContent = now.toLocaleTimeString('ko-KR');
  }
  
  updateTime();
  setInterval(updateTime, 1000);
  document.body.appendChild(timeElement);
}

// 필요시 활성화: displayCurrentTime();
