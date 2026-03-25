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

function setupThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  const html = document.documentElement;

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    document.body.classList.toggle('dark-mode', theme === 'dark');
    localStorage.setItem('theme', theme);
    if (themeToggle) {
      themeToggle.checked = theme === 'dark';
    }
  }

  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);

  themeToggle.addEventListener('change', () => {
    const newTheme = themeToggle.checked ? 'dark' : 'light';
    applyTheme(newTheme);
  });
}

function setupPostWriter() {
  const postInput = document.getElementById('user-post');
  const submitBtn = document.getElementById('post-submit');
  const postsList = document.getElementById('posts-list');
  const loginId = document.getElementById('login-id');
  const loginPassword = document.getElementById('login-password');
  const loginSubmit = document.getElementById('login-submit');
  const loginMessage = document.getElementById('login-message');

  const authUser = {
    id: 'seolhwa0508',
    password: 'seolhwa0508?@'
  };

  let currentUser = null;

  function setPostFormEnabled(enabled) {
    postInput.disabled = !enabled;
    submitBtn.disabled = !enabled;
    postInput.style.background = enabled ? 'white' : '#f0f0f0';
    submitBtn.style.opacity = enabled ? '1' : '0.6';
    submitBtn.style.cursor = enabled ? 'pointer' : 'not-allowed';
  }

  function addPost(content) {
    if (!content.trim()) return;

    const card = document.createElement('article');
    card.className = 'card';
    card.style.marginTop = '0.75rem';
    card.innerHTML = `
      <h3 style="margin:0 0 0.5rem 0;">${currentUser || '익명'}님의 글</h3>
      <p style="margin:0; color:var(--text); line-height:1.6;">${content.replace(/\n/g, '<br>')}</p>
    `;

    postsList.prepend(card);
  }

  loginSubmit.addEventListener('click', () => {
    const id = loginId.value.trim();
    const password = loginPassword.value.trim();

    if (!id || !password) {
      loginMessage.textContent = '아이디와 비밀번호를 모두 입력해주세요.';
      return;
    }

    if (id === authUser.id && password === authUser.password) {
      currentUser = id;
      loginMessage.style.color = '#22c55e';
      loginMessage.textContent = `${id}님 환영합니다! 이제 글을 작성할 수 있습니다.`;
      setPostFormEnabled(true);
      loginId.disabled = true;
      loginPassword.disabled = true;
      loginSubmit.disabled = true;
    } else {
      loginMessage.style.color = '#db2777';
      loginMessage.textContent = '아이디 또는 비밀번호가 틀렸습니다.';
    }
  });

  setPostFormEnabled(false);

  submitBtn.addEventListener('click', () => {
    if (!postInput || !currentUser) {
      alert('로그인 후 글을 작성해주세요.');
      return;
    }

    const value = postInput.value;

    if (!value.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    addPost(value);
    postInput.value = '';
  });
}

function init() {
  updateYear();
  setupNavigation();
  setupGridInteraction();
  setupThemeToggle();
  setupPostWriter();
  console.log('Seolhwa 페이지 초기화 완료');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
