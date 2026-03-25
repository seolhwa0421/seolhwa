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
    html.classList.toggle('dark-mode', theme === 'dark');
    html.classList.toggle('dark', theme === 'dark');
    document.body.classList.toggle('dark-mode', theme === 'dark');
    document.body.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
    if (themeToggle) {
      themeToggle.checked = theme === 'dark';
    }
    console.log('[ThemeToggle] applied theme=', theme, {
      htmlDataset: html.dataset.theme,
      htmlClass: html.className,
      bodyClass: document.body.className,
      localStorage: localStorage.getItem('theme')
    });
  }

  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);

  if (!themeToggle) return;
  themeToggle.addEventListener('change', () => {
    const newTheme = themeToggle.checked ? 'dark' : 'light';
    applyTheme(newTheme);
  });
}

function setupGridInteraction() {
  const cards = document.querySelectorAll('.item');
  cards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-2px)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
    });
  });
}

function setupPostWriter() {
  const postInput = document.getElementById('user-post');
  const postImageInput = document.getElementById('post-image');
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
    postImageInput.disabled = !enabled;
    submitBtn.disabled = !enabled;

    // theme-driven form styles (dark/light)
    postInput.style.background = '';
    postInput.style.color = '';
    postImageInput.style.background = '';
    postImageInput.style.color = '';

    submitBtn.style.opacity = enabled ? '1' : '0.6';
    submitBtn.style.cursor = enabled ? 'pointer' : 'not-allowed';
  }

  function addPost(content, imageDataUrl) {
    if (!content.trim() && !imageDataUrl) return;

    const card = document.createElement('article');
    card.className = 'card';
    card.style.marginTop = '0.75rem';

    const date = new Date();
    const dateString = date.toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric', weekday:'short' });

    let imageSection = '';
    if (imageDataUrl) {
      imageSection = `
        <div style="margin-bottom:0.75rem; border-radius:10px; overflow:hidden;">
          <img src="${imageDataUrl}" alt="사용자 업로드 이미지" style="width:100%; height:auto; display:block; object-fit:cover;" />
        </div>
      `;
    }

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
        <h3 style="margin:0; font-size:1.05rem;">${currentUser || '익명'}님의 기록</h3>
        <small style="color:var(--muted);">${dateString}</small>
      </div>
      ${imageSection}
      <p style="margin:0; color:var(--text); line-height:1.6; white-space:pre-wrap;">${content.replace(/\n/g, '<br>')}</p>
    `;

    postsList.prepend(card);
  }

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
    const file = postImageInput.files && postImageInput.files[0];

    if (!value.trim() && !file) {
      alert('본문 또는 이미지를 입력해 주세요.');
      return;
    }

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        addPost(value, reader.result);
        postInput.value = '';
        postImageInput.value = '';
      };
      reader.onerror = () => {
        alert('이미지를 불러오는 중 오류가 발생했습니다.');
      };
      reader.readAsDataURL(file);
    } else {
      addPost(value, null);
      postInput.value = '';
      postImageInput.value = '';
    }
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
