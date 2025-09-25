"use strict";

// 윈도우 사이즈 체크
const windowSize = {
  winSize: null,
  breakPoint: 1024,

  setWinSize() {
    this.winSize = window.innerWidth >= this.breakPoint ? "pc" : "mob";
    this.applyBodyClass(); // body에 클래스 적용
  },

  getWinSize() {
    return this.winSize;
  },
  applyBodyClass() {
    document.body.classList.remove("pc", "mob"); // 기존 클래스 제거
    document.body.classList.add(this.winSize); // 새로운 클래스 추가
  },
};

// 스크롤 방향 체크
const scrollManager = {
  _scrollY: 0,
  _scrollH: 0,
  _lastScrollY: 0,

  updateScrollValues() {
    this._scrollY = window.scrollY;
    this._scrollH = document.body.scrollHeight;
  },

  handleScrollDirection() {
    const $wrap = document.querySelector("#wrap");
    if ($wrap) {
      const _conOffsetTop = document.querySelector("#container").offsetTop;
      const _scrollY = window.scrollY;
      const _scrollDown = _scrollY > this._lastScrollY;
      const _scrollUp = _scrollY < this._lastScrollY;

      if (_scrollY > _conOffsetTop + 50 && _scrollDown) {
        $wrap.classList.add("scroll-down");
        $wrap.classList.remove("scroll-up");
      } else if (_scrollY > _conOffsetTop + 50 && _scrollUp) {
        $wrap.classList.add("scroll-up");
        $wrap.classList.remove("scroll-down");
      } else {
        $wrap.classList.remove("scroll-down", "scroll-up");
      }

      this._lastScrollY = _scrollY;
    }
  },

  getscrollY() {
    return this._scrollY;
  },

  getScrollH() {
    return this._scrollH;
  },
};

// common
const common = {
  focusTrap(trap) {
    const focusableElements = trap.querySelectorAll(
      `a, button, [tabindex="0"], input, textarea, select`
    );

    if (!focusableElements.length) return;

    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement =
      focusableElements[focusableElements.length - 1];

    trap.addEventListener("keydown", (event) => {
      if (event.key === "Tab") {
        if (
          event.shiftKey &&
          document.activeElement === firstFocusableElement
        ) {
          event.preventDefault();
          lastFocusableElement.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === lastFocusableElement
        ) {
          event.preventDefault();
          firstFocusableElement.focus();
          // 모달 오픈 후 첫 초점 역방향 제어(modal-content가 첫초점이 아니면 사용 안해도 됨)
        } else if (
          event.key === "Tab" &&
          event.shiftKey &&
          document.activeElement === trap
        ) {
          event.preventDefault();
          lastFocusableElement.focus();
        }
      }
    });
  },
};

/*** * mainMenuMobile * ***/
const mainMenuMobile = {
  init() {
    const mobileGnb = document.querySelector(".main-menu-mobile");
    if (!mobileGnb) return;
    if (mobileGnb.classList.contains("is-open")) {
      this.openMainMenu(mobileGnb);
    } else {
      mobileGnb.style.display = "none";
    }
    mobileGnb.addEventListener("click", (event) => {
      if (!event.target.closest(".gnb-wrap")) {
        mobileGnb.querySelector(".gnb-wrap").focus();
      }
    });
    this.attachEvents(mobileGnb);
  },
  attachEvents(mobileGnb) {
    const id = mobileGnb.getAttribute("id");
    const openGnb = document.querySelector(`[aria-controls=${id}]`);
    const closeGnb = mobileGnb.querySelector("#close-nav");
    openGnb.addEventListener("click", () => this.openMainMenu(mobileGnb));
    closeGnb.addEventListener("click", () => this.closeMainMenu(mobileGnb));
    window.addEventListener("resize", () => {
      const isPC = windowSize.getWinSize() === "pc";
      if (isPC) this.closeMainMenu(mobileGnb);
    });
  },
  openMainMenu(mobileGnb) {
    const navContainer = mobileGnb.querySelector(".gnb-wrap");
    mobileGnb.style.display = "block";
    navContainer.setAttribute("tabindex", 0);
    setTimeout(() => {
      mobileGnb.classList.add("is-backdrop", "is-open");
      document.body.classList.add("is-gnb-mobile");
    }, 100);
    mobileGnb.addEventListener("transitionend", function onTransitionEnd() {
      navContainer.focus();
      mobileGnb.removeEventListener("transitionend", onTransitionEnd);
      document.querySelector("#header .main-header").setAttribute("inert", "");
      document.getElementById("container")?.setAttribute("inert", "");
      document.getElementById("footer")?.setAttribute("inert", "");
      common.focusTrap(mobileGnb);
    });
  },
  closeMainMenu(mobileGnb) {
    const id = mobileGnb.getAttribute("id");
    const openGnb = document.querySelector(`[aria-controls=${id}]`);
    mobileGnb.classList.remove("is-backdrop", "is-open");
    document.querySelector("#header .main-header").removeAttribute("inert");
    document.getElementById("container")?.removeAttribute("inert");
    document.getElementById("footer")?.removeAttribute("inert");
    mobileGnb.addEventListener("transitionend", function onTransitionEnd() {
      openGnb.focus();
      mobileGnb.removeEventListener("transitionend", onTransitionEnd);
    });
    setTimeout(() => {
      mobileGnb.style.display = "none";
      document.body.classList.remove("is-gnb-mobile");
    }, 400);
  },
};
/*** * basic_tab * ***/
const basic_tab = {
  layerTabArea: null,
  init() {
    this.layerTabArea = document.querySelectorAll(".tab-area.layer");

    if (!this.layerTabArea.length) return;

    this.setupTabs();
  },
  setupTabs() {
    this.layerTabArea.forEach((tabArea) => {
      const layerTabs = tabArea.querySelectorAll(".tab > ul > li");

      // 탭 설정
      layerTabs.forEach((tab) => {
        // 이미 이벤트가 연결된 탭을 건너뜀
        if (!tab.dataset.listenerAttached) {
          // 연결된 탭 패널 찾기
          const control = tab.getAttribute("aria-controls");
          const selectedTabPanel = document.getElementById(control);

          // aria 설정
          tab.setAttribute("aria-selected", "false");
          tab.setAttribute("role", "tab");
          selectedTabPanel.setAttribute("role", "tabpanel");

          // 초기 active 설정
          if (tab.classList.contains("active")) {
            if (!tab.querySelector("a .sr-only")) {
              tab.setAttribute("aria-selected", "true");
              tab.querySelector("button").append(this.createAccText()); // 초점이 버튼이라 aria-selected 대체 텍스트 필요
            }
          }

          // 클릭 이벤트
          tab.addEventListener("click", () => {
            const closestTabs = tab
              .closest(".tab-area.layer > .tab")
              .querySelectorAll("li");
            const closestTabPanels = tab
              .closest(".tab-area.layer")
              .querySelectorAll(":scope > .tab-conts-wrap > .tab-conts");

            this.resetTabs(closestTabs, closestTabPanels);

            tab.classList.add("active");
            tab.querySelector("button").append(this.createAccText());
            tab.setAttribute("aria-selected", "true");
            selectedTabPanel.classList.add("active");
          });

          // 키보드 이벤트
          this.setupKeyboardNavigation(tab);

          // 이벤트가 추가된 탭을 표시
          tab.dataset.listenerAttached = "true";
        }
      });
    });
  },
  createAccText() {
    const tabAccTag = document.createElement("i");
    tabAccTag.classList.add("sr-only");
    tabAccTag.textContent = "선택됨";
    return tabAccTag;
  },
  resetTabs(closestTabs, closestTabPanels) {
    closestTabs.forEach((tab) => {
      tab.classList.remove("active");
      tab.setAttribute("aria-selected", "false");
      // 대체 텍스트 삭제
      const srOnly = tab.querySelector(".sr-only");
      if (srOnly) tab.querySelector("button").removeChild(srOnly);
    });
    closestTabPanels.forEach((panel) => {
      panel.classList.remove("active");
    });
  },
  setupKeyboardNavigation(tab) {
    tab.addEventListener("keydown", function (event) {
      let newTab;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        newTab = tab.nextElementSibling?.querySelector("button");
      } else if (event.key === "ArrowLeft") {
        newTab = tab.previousElementSibling?.querySelector("button");
      }
      newTab?.focus();
    });
  },
};

/*** * dropEvent(gnb utils / page-title-wrap) * ***/
const dropEvent = {
  dropButtons: null,
  init() {
    this.dropButtons = document.querySelectorAll(".drop-wrap .drop-btn");

    if (!this.dropButtons.length) return;

    this.setupEventListeners();
    this.setupFocusOutEvent();
  },
  setupEventListeners() {
    this.dropButtons.forEach((button) => {
      const menu = button.nextElementSibling;
      button.setAttribute("aria-expanded", "false");

      button.addEventListener("click", () => {
        const isOpen = menu.style.display === "block";
        this.closeAllDropdowns();
        if (!isOpen) {
          this.openDropdown(button, menu);
        }
      });

      this.setupMenuItems(menu);
    });
  },
  setupMenuItems(menu) {
    const items = menu.querySelectorAll(".item-link");

    items.forEach((item) => {
      item.innerHTML += `<span class="sr-only"></span>`;
      if (item.classList.contains("active")) {
        item.querySelector(".sr-only").innerHTML = "선택됨";
      }

      item.addEventListener("click", () => {
        this.activateMenuItem(item);
        this.closeAllDropdowns();
        const button = item.closest(".drop-wrap").querySelector(".drop-btn");
        button?.focus();
      });

      item.addEventListener("focus", () => {
        document
          .querySelectorAll(".drop-wrap .link-list .item-link")
          .forEach((item) => {
            item.style.position = "relative";
            item.style.zIndex = "0";
          });
        item.style.zIndex = "1";
      });
    });
  },
  activateMenuItem(selectedItem) {
    const menu = selectedItem.closest(".drop-menu");
    const items = menu.querySelectorAll(".item-link");

    items.forEach((item) => {
      item.classList.remove("active");
      item.setAttribute("aria-selected", "false");
      item.querySelector(".sr-only").innerText = "";
    });

    selectedItem.classList.add("active");
    selectedItem.setAttribute("aria-selected", "true");
    selectedItem.querySelector(".sr-only").innerText = "선택됨";
  },
  openDropdown(button, menu) {
    menu.style.display = "block";
    button.classList.add("active");
    button.setAttribute("aria-expanded", "true");

    // 여백에 따라 위치 조정
    const menuRect = menu.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    if (menuRect.left < 0) {
      menu.closest(".drop-wrap").classList.add("drop-left");
    } else if (windowWidth < menuRect.left + menuRect.width) {
      menu.closest(".drop-wrap").classList.add("drop-right");
    }
  },
  closeAllDropdowns() {
    document.querySelectorAll(".drop-wrap .drop-menu").forEach((menu) => {
      menu.style.display = "none";
    });
    this.dropButtons.forEach((button) => {
      button.classList.remove("active");
      button.setAttribute("aria-expanded", "false");
    });
  },
  setupFocusOutEvent() {
    // ESC 닫기
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" || event.key === "Esc") {
        this.closeAllDropdowns();
        event.target.closest(".drop-wrap")?.querySelector(".drop-btn")?.focus();
      }
    });

    // 드롭다운 외부 클릭 시 닫기
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".drop-wrap")) {
        this.closeAllDropdowns();
      }
    });

    // 드롭다운 포커스 아웃 처리
    this.dropButtons.forEach((button) => {
      const menu = button.nextElementSibling;

      if (!menu) return;

      // 드롭다운 메뉴의 포커스 아웃 처리
      menu.addEventListener("focusout", (event) => {
        const isFocusInside =
          menu.contains(event.relatedTarget) ||
          button.contains(event.relatedTarget);
        if (!isFocusInside) {
          this.closeAllDropdowns();
        }
      });

      // 버튼의 포커스 아웃 처리
      button.addEventListener("focusout", (event) => {
        const isFocusInside =
          menu.contains(event.relatedTarget) ||
          button.contains(event.relatedTarget);
        if (!isFocusInside) {
          this.closeAllDropdowns();
        }
      });
    });
  },
};
// goTopBtn
const goTopBtn = () => {
  const contentArea = document.querySelector("#wrap");
  if (contentArea) {
    const goTopTag = document.createElement("button");
    goTopTag.className = "page-totop";
    goTopTag.type = "button";
    goTopTag.innerHTML = `<i class="icon ico-to-top"></i>`;
    goTopTag.setAttribute("data-tooltip", "페이지 상단으로 이동");
    contentArea.append(goTopTag);

    const home = contentArea.querySelector("#container > *");
    const toggleVisibility = () => {
      goTopTag.classList.toggle(
        "active",
        window.scrollY > window.innerHeight * 1.5
      );
    };
    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      home?.focus();
    };
    window.addEventListener("scroll", toggleVisibility);
    goTopTag.addEventListener("click", scrollToTop);
  }
};

// mainPopuplayer
const mainPopuplayer = () => {
  const popup = document.querySelector(".layer-popup");
  const body = document.body;
  const todayClose = document.getElementById("todayClose");
  const closeBtn = document.querySelector(".btn.sm"); // 팝업 닫기 버튼
  const popupKey = "popupClosedDate";

  if (!popup) return; // 팝업이 없으면 실행 중단

  // 오늘 하루 닫힘 확인
  const savedDate = localStorage.getItem(popupKey);
  const now = new Date();
  const today = now.toISOString().slice(0, 10); // YYYY-MM-DD

  if (savedDate === today) {
    // 저장된 날짜가 오늘과 같으면 팝업 안 띄움
    popup.style.display = "none";
    body.classList.remove("haspop");
    return;
  }

  // 팝업 보이기
  popup.classList.add("on");
  body.classList.add("haspop");

  // 닫기 버튼 클릭 이벤트
  closeBtn?.addEventListener("click", function () {
    // 오늘 하루 닫기 체크되었으면 저장
    if (todayClose.checked) {
      localStorage.setItem(popupKey, today);
    }

    popup.classList.add("off");
    body.classList.remove("haspop");
    popup.style.display = "none";
  });
};

// 초기 이벤트
window.addEventListener("DOMContentLoaded", () => {
  // 윈도우 사이즈 체크
  windowSize.setWinSize();
  mainMenuMobile.init();
  basic_tab.init();
  dropEvent.init();
  goTopBtn();
  mainPopuplayer();
});

// 스크롤 이벤트
window.addEventListener("scroll", () => {
  scrollManager.updateScrollValues();
  scrollManager.handleScrollDirection();
});

// 리사이즈 이벤트
window.addEventListener("resize", () => {
  windowSize.setWinSize();
});
