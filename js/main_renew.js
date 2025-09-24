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

/*** * mainMenuPC * ***/
const mainMenuPC = {
  init() {
    const gnbMenu = document.querySelector(".main-menu:not(.sample) .gnb-menu");

    if (!gnbMenu) return;

    // gnb 속성설정
    gnbMenu.setAttribute("aria-label", "메인 메뉴");

    // dimed 요소를 설정, 기존 dimed가 없을 경우 생성
    this.backdrop =
      document.querySelector(".gnb-backdrop") || this.createBackdrop();

    // 주 메뉴 및 서브 메뉴의 트리거를 설정하고, 각 트리거에 이벤트를 연결
    const mainTriggers = gnbMenu.querySelectorAll(".gnb-main-trigger");
    const subTriggers = gnbMenu.querySelectorAll(
      ".gnb-sub-trigger:not(.is-link)"
    );
    mainTriggers.forEach((mainTrigger) => this.setupMainTrigger(mainTrigger));
    this.attachEvents(mainTriggers, subTriggers);
    this.setupKeyboardNavigation(mainTriggers);
  },
  setupMainTrigger(mainTrigger) {
    const toggleWrap = mainTrigger.nextElementSibling;
    if (toggleWrap) {
      const uniqueIdx = `gnb-main-menu-${Math.random()
        .toString(36)
        .substring(2, 9)}`;
      mainTrigger.setAttribute("aria-controls", uniqueIdx);
      mainTrigger.setAttribute("aria-expanded", "false");
      mainTrigger.setAttribute("aria-haspopup", "true");
      toggleWrap.setAttribute("id", uniqueIdx);

      // 하위 메뉴 설정
      const mainList = toggleWrap.querySelector(".gnb-toggle-wrap");
      if (mainList?.getAttribute("data-has-submenu") === "true") {
        const subTriggers = mainList.querySelectorAll(".gnb-sub-trigger");
        subTriggers.forEach((subTrigger) => this.setupSubTrigger(subTrigger));
        if (
          subTriggers.length > 0 &&
          !subTriggers[0].classList.contains("is-link")
        ) {
          subTriggers[0].classList.add("active");
          subTriggers[0].setAttribute("aria-expanded", "true");
          subTriggers[0].nextElementSibling?.classList.add("active");
        }
      }
    }
  },
  setupSubTrigger(subTrigger) {
    const hasMenu = subTrigger.nextElementSibling;
    if (hasMenu) {
      const uniqueIdx = `gnb-sub-menu-${Math.random()
        .toString(36)
        .substring(2, 9)}`;
      subTrigger.setAttribute("aria-controls", uniqueIdx);
      subTrigger.setAttribute("aria-expanded", "false");
      subTrigger.setAttribute("aria-haspopup", "true");
      hasMenu.setAttribute("id", uniqueIdx);
    }
  },
  toggleMainMenu(mainTrigger) {
    const gnbMenuon = mainTrigger.closest(".gnb-menu"); // 상위 gnb-menu 찾기
    const isActive = mainTrigger.classList.contains("active");
    const isDropDown = mainTrigger.classList.contains("is-dropdown");
    if (!isActive && mainTrigger.nextElementSibling) {
      this.resetMainMenu();
      mainTrigger.setAttribute("aria-expanded", "true");
      mainTrigger.classList.add("active");
      mainTrigger.nextElementSibling.classList.add("is-open");

      // gnb-menu에 active 클래스 추가
      gnbMenuon.classList.add("active");
      // ------------------------------
      // 열릴 때마다 height 계산 후 적용
      const gnbMenuHeight = gnbMenuon.offsetHeight;
      const triggerHeight = mainTrigger.offsetHeight;
      const calcHeight = gnbMenuHeight - triggerHeight;

      gnbMenuon.querySelectorAll(".gnb-toggle-wrap").forEach((wrap) => {
        wrap.style.height = `${calcHeight}px`;
      });
      // ------------------------------
      if (!isDropDown) {
        this.toggleBackdrop(true);
        this.toggleScrollbar(true);
        this.adjustSubMenuHeight(
          mainTrigger.nextElementSibling.querySelector(".gnb-main-list")
        );
      }
    } else {
      this.closeMainMenu();
    }
  },
  toggleSubMenu(subTrigger) {
    const otherSubTriggers = subTrigger
      .closest("ul")
      .querySelectorAll(".gnb-sub-trigger:not(.is-link)");
    otherSubTriggers.forEach((trigger) => {
      trigger.classList.remove("active");
      trigger.setAttribute("aria-expanded", "false");
      trigger.nextElementSibling?.classList.remove("active");
    });
    subTrigger.classList.add("active");
    subTrigger.setAttribute("aria-expanded", "true");
    subTrigger.nextElementSibling?.classList.add("active");
    this.adjustSubMenuHeight(subTrigger.closest(".gnb-main-list"));
  },
  createBackdrop() {
    const backdrop = document.createElement("div");
    backdrop.classList.add("gnb-backdrop");
    document.body.appendChild(backdrop);
    // backdrop.style.display = "none";
    return backdrop;
  },
  toggleBackdrop(isOpen) {
    this.backdrop?.classList.toggle("active", isOpen);
    document.body.classList.toggle("is-gnb-web", isOpen);
    // this.backdrop.style.display = isOpen ? "block" : "none";
  },
  adjustSubMenuHeight(target) {
    // 서브 메뉴 높이를 활성 메뉴에 맞춰 조정
    const activeSubList = target.querySelector(".gnb-sub-list.active");
    const height = activeSubList?.scrollHeight || 0;
    target.style.minHeight = `${height}px`;
  },
  toggleScrollbar(isEnabled) {
    const isScrollNeeded = document.body.scrollHeight > window.innerHeight;
    document.body.classList.toggle("hasScrollY", isEnabled && isScrollNeeded);
  },
  resetMainMenu() {
    document
      .querySelectorAll(
        ".main-menu:not(.sample) .gnb-main-trigger:not(.is-link)"
      )
      .forEach((mainTrigger) => {
        mainTrigger.classList.remove("active");
        mainTrigger.setAttribute("aria-expanded", "false");
      });
    document
      .querySelectorAll(".main-menu:not(.sample) .gnb-toggle-wrap")
      .forEach((toggleWrap) => {
        toggleWrap.classList.remove("is-open");
      });
  },
  closeMainMenu() {
    this.resetMainMenu();
    this.toggleBackdrop(false);
    this.toggleScrollbar(false);
    // gnb-menu의 active 클래스 제거
    document.querySelector(".main-menu .gnb-menu")?.classList.remove("active");
    // 기존 닫기 처리 로직 …
    document.querySelectorAll(".gnb-toggle-wrap").forEach((wrap) => {
      wrap.style.height = "auto"; // 닫을 때 0으로 초기화
    });
  },
  attachEvents(mainTriggers, subTriggers) {
    // main-menu 외부 클릭시 닫기
    document.addEventListener("click", ({ target }) => {
      if (!target.closest(".main-menu")) this.closeMainMenu();
    });

    // 백드롭 클릭 시 메뉴 닫기
    // this.backdrop.addEventListener("click", () => this.closeMainMenu());

    // ESC 키를 눌러 메뉴를 닫거나, TAB 키로 초점이 메뉴 외부로 이동했을 때 메뉴 닫기
    document.addEventListener("keyup", (event) => {
      if (event.code === "Escape" || !event.target.closest(".main-menu")) {
        this.closeMainMenu();
      }
    });

    // 메인 메뉴 트리거 설정
    mainTriggers.forEach((mainTrigger) => {
      mainTrigger.addEventListener("click", () =>
        this.toggleMainMenu(mainTrigger)
      );
    });

    // 서브 메뉴 트리거 설정
    subTriggers.forEach((subTrigger) => {
      subTrigger.addEventListener("click", () =>
        this.toggleSubMenu(subTrigger)
      );
    });
  },
  setupKeyboardNavigation(mainTriggers) {
    const focusMenuItem = (element) => {
      if (element) {
        element.focus();
      }
    };
    const findFocusableElement = (element, direction) => {
      const sibling =
        direction === "next" ? "nextElementSibling" : "previousElementSibling";
      const parent = element.closest("li")?.[sibling];
      return parent ? parent.querySelector("[data-trigger]") : null;
    };
    //hover,focus시 클래스 추가
    document.querySelectorAll(".gnb-menu > li").forEach((li) => {
      const addHover = () => {
        // 형제들의 hover 제거
        li.parentElement.querySelectorAll("li").forEach((sibling) => {
          sibling.classList.remove("hover");
        });
        // 현재 li에만 hover 추가
        li.classList.add("hover");
      };

      const removeHover = () => {
        li.classList.remove("hover");
      };

      li.addEventListener("mouseover", addHover);
      li.addEventListener("focusin", addHover);

      li.addEventListener("mouseout", removeHover);
      li.addEventListener("focusout", removeHover);
    });
    // Home, End, 방향키를 통해 메뉴 항목 간의 이동을 처리
    document.addEventListener("keydown", (event) => {
      const target = event.target;
      if (target.getAttribute("data-trigger")) {
        switch (event.key) {
          case "Home":
            event.preventDefault();
            focusMenuItem(mainTriggers[0]);
            break;
          case "End":
            event.preventDefault();
            focusMenuItem(mainTriggers[mainTriggers.length - 1]);
            break;
          case "ArrowRight":
          case "ArrowDown":
            event.preventDefault();
            const nextElement = findFocusableElement(target, "next");
            focusMenuItem(nextElement);
            break;
          case "ArrowLeft":
          case "ArrowUp":
            event.preventDefault();
            const previousElement = findFocusableElement(target, "prev");
            focusMenuItem(previousElement);
            break;
          default:
            break;
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

    // gnb 외부 클릭 처리
    mobileGnb.addEventListener("click", (event) => {
      if (!event.target.closest(".gnb-wrap")) {
        mobileGnb.querySelector(".gnb-wrap").focus();
      }
    });

    // 접근성 설정(tab)
    this.setupAriaAttributes(mobileGnb);

    this.attachEvents(mobileGnb);
  },
  setupAriaAttributes(mobileGnb) {
    const tabList = mobileGnb.querySelector(".menu-wrap");
    if (tabList) {
      tabList.querySelector(".menu-wrap ul").setAttribute("role", "tablist");
      tabList
        .querySelectorAll(".menu-wrap li")
        .forEach((li) => li.setAttribute("role", "none"));

      const tabs = document.querySelectorAll(".menu-wrap .gnb-main-trigger");
      tabs.forEach((item, idx) => {
        item.setAttribute("role", "tab");
        item.setAttribute("aria-selected", "false");
        item.setAttribute(
          "aria-controls",
          item.getAttribute("href").substring(1)
        );
        item.setAttribute("id", `tab-${idx}`);

        // gnb-main-trigger 클릭시 해당 위치로 스크롤
        item.addEventListener("click", (event) => {
          event.preventDefault();
          const id = item.getAttribute("aria-controls");
          const top = document.getElementById(id).offsetTop;
          const gnbBody = document.querySelector(".gnb-body");
          gnbBody.scrollTo({
            left: 0,
            top: top,
            behavior: "smooth",
          });
        });
      });

      const tabPanels = document.querySelectorAll(
        ".submenu-wrap .gnb-sub-list"
      );
      tabPanels.forEach((item, idx) => {
        item.setAttribute("role", "tabpanel");
        item.setAttribute("aria-labelledby", `tab-${idx}`);
      });
    }
  },
  attachEvents(mobileGnb) {
    const id = mobileGnb.getAttribute("id");
    const openGnb = document.querySelector(`[aria-controls=${id}]`);
    const closeGnb = mobileGnb.querySelector("#close-nav");

    openGnb.addEventListener("click", () => this.openMainMenu(mobileGnb));
    closeGnb.addEventListener("click", () => this.closeMainMenu(mobileGnb));
    this.setupAnchorScroll(mobileGnb);
    this.setupAnchorLinks(mobileGnb);

    // 반응형 처리
    window.addEventListener("resize", () => {
      const isPC = windowSize.getWinSize() === "pc";
      if (isPC) this.closeMainMenu(mobileGnb);
    });
  },
  openMainMenu(mobileGnb) {
    const navContainer = mobileGnb.querySelector(".gnb-wrap");

    mobileGnb.style.display = "block";
    navContainer.setAttribute("tabindex", 0);
    // openGnb.setAttribute("aria-expanded", "true");
    // header.style.zIndex = "1000";

    // active 메뉴로 스크롤 이동
    const activeTrigger = document.querySelector(".gnb-main-trigger.active");
    if (activeTrigger) {
      const id = activeTrigger.getAttribute("aria-controls");
      const top = document.getElementById(id).offsetTop;
      const gnbBody = document.querySelector(".gnb-body");
      gnbBody.style.scrollBehavior = "auto";
      gnbBody.scrollTop = top;
    }

    setTimeout(() => {
      mobileGnb.classList.add("is-backdrop");
      mobileGnb.classList.add("is-open");
      document.body.classList.add("is-gnb-mobile");
    }, 100);

    // transition 종료후 실행
    mobileGnb.addEventListener("transitionend", function onTransitionEnd() {
      navContainer.focus();
      mobileGnb.removeEventListener("transitionend", onTransitionEnd);

      // inert 설정
      document.querySelector("#header .main-header").setAttribute("inert", "");
      document.getElementById("container")?.setAttribute("inert", "");
      document.getElementById("footer")?.setAttribute("inert", "");

      // 포커스 트랩 설정
      common.focusTrap(mobileGnb);
    });
  },
  closeMainMenu(mobileGnb) {
    const id = mobileGnb.getAttribute("id");
    const openGnb = document.querySelector(`[aria-controls=${id}]`);

    mobileGnb.classList.remove("is-backdrop");
    mobileGnb.classList.remove("is-open");

    // inert 설정
    document.querySelector("#header .main-header").removeAttribute("inert");
    document.getElementById("container")?.removeAttribute("inert");
    document.getElementById("footer")?.removeAttribute("inert");

    // transition 종료후 실행
    mobileGnb.addEventListener("transitionend", function onTransitionEnd() {
      openGnb.focus();
      mobileGnb.removeEventListener("transitionend", onTransitionEnd);
    });

    setTimeout(() => {
      mobileGnb.style.display = "none";
      document.body.classList.remove("is-gnb-mobile");
    }, 400);
  },
  setupAnchorScroll(mobileGnb) {
    const gnbBody = mobileGnb.querySelector(".gnb-body");
    const navContainer = mobileGnb.querySelector(".gnb-wrap");
    const navItems = mobileGnb.querySelectorAll(".submenu-wrap .gnb-sub-list");
    const headerTabArea = mobileGnb.querySelector(".gnb-tab-nav");
    const headerTabMenu = headerTabArea?.querySelector(".menu-wrap");

    gnbBody.addEventListener("scroll", () => {
      const scrollTop = gnbBody.scrollTop;
      const scrollHeight = gnbBody.scrollHeight;
      const bodyHeight = gnbBody.clientHeight;

      navItems.forEach((item) => {
        const id = item.getAttribute("id");
        const menuLink = mobileGnb.querySelector(`[href="#${id}"]`);
        const offset = item.offsetTop;
        if (scrollTop >= offset || bodyHeight + scrollTop >= scrollHeight) {
          this.resetAnchorMenu();
          menuLink.classList.add("active");
          menuLink.setAttribute("aria-selected", "true");
          if (headerTabArea) {
            const headerTabMenuUl = headerTabMenu.querySelector("ul");
            gnbBody.addEventListener("scrollend", () => {
              headerTabMenuUl.scrollLeft = menuLink.offsetLeft;
            });
          }
        }
      });

      this.handleTopScroll(headerTabArea, navContainer, gnbBody);
    });
  },
  handleTopScroll(headerTabArea, navContainer, gnbBody) {
    // gnb-mobile-type1(headerTabArea: gnb-tab-nav)
    let lastBodyScrollY = 0;

    if (!headerTabArea) return; // 요소가 없을 경우 함수 종료

    gnbBody.addEventListener("scroll", (event) => {
      const bodyScrollY = event.target.scrollTop;

      if (bodyScrollY > 0) {
        headerTabArea.style.height = `${headerTabArea.scrollHeight}px`;
        headerTabArea.style.transition = "ease-out .4s";
        navContainer.classList.add("is-active");
      } else if (bodyScrollY < 50 && bodyScrollY < lastBodyScrollY) {
        headerTabArea.style.height = "";
        headerTabArea.style.transition = "ease-out .4s .2s";
        setTimeout(() => {
          navContainer.classList.remove("is-active");
        }, 600);
      }

      lastBodyScrollY = bodyScrollY;
    });
  },
  setupAnchorLinks(mobileGnb) {
    const menuItems = mobileGnb.querySelectorAll(
      ".menu-wrap .gnb-main-trigger"
    );
    const navItems = mobileGnb.querySelectorAll(".submenu-wrap .gnb-sub-list");

    if (!document.querySelector(".menu-wrap .gnb-main-trigger.active")) {
      menuItems[0].classList.add("active");
      menuItems[0].setAttribute("aria-selected", "true");
    }

    // 3depth
    navItems.forEach((item) => {
      const depth3Items = item.querySelectorAll(".has-depth3");
      if (depth3Items.length > 0) {
        depth3Items.forEach((item) => {
          if (item.classList.contains("active")) {
            item.classList.add("active");
            item.setAttribute("aria-expanded", "true");
            item.nextElementSibling.classList.add("is-open");
          } else {
            item.setAttribute("aria-expanded", "false");
          }
          item.addEventListener("click", (event) =>
            this.handleDepth3Click(event, item)
          );
        });
      }
    });

    // 4depth
    navItems.forEach((item) => {
      const depth4Items = item.querySelectorAll(".has-depth4");
      if (depth4Items.length > 0) {
        depth4Items.forEach((item) => {
          item.addEventListener("click", (event) =>
            this.handleDepth4Click(event, item)
          );
        });
      }
    });
  },
  handleDepth3Click(event) {
    const isActive = event.target.classList.contains("active");

    const resetList = () => {
      document.querySelectorAll(".has-depth3").forEach((depth3) => {
        depth3.classList.remove("active");
        depth3.setAttribute("aria-expanded", "false");
        depth3.nextElementSibling.classList.remove("is-open");
      });
    };

    if (!isActive) {
      // resetList();
      event.target.classList.add("active");
      event.target.setAttribute("aria-expanded", "true");
      event.target.nextElementSibling.classList.add("is-open");
    } else {
      // resetList();
      event.target.classList.remove("active");
      event.target.setAttribute("aria-expanded", "false");
      event.target.nextElementSibling.classList.remove("is-open");
    }
  },
  handleDepth4Click(event) {
    const target = event.target.nextElementSibling;
    const prevButton = target.querySelector(".trigger-prev");
    const closeButton = target.querySelector(".trigger-close");

    target.style.display = "block";
    setTimeout(() => {
      target.classList.add("is-open");
    }, 0);
    prevButton.focus();

    const depth4Close = () => {
      target.classList.remove("is-open");
      event.target.focus();
      setTimeout(() => {
        target.style.display = "";
      }, 400);
    };

    prevButton.addEventListener("click", depth4Close);
    closeButton.addEventListener("click", depth4Close);

    // 포커스 트랩 설정
    common.focusTrap(target);
  },
  resetAnchorMenu() {
    document
      .querySelectorAll(".main-menu-mobile .menu-wrap .gnb-main-trigger")
      .forEach((menu) => {
        menu.classList.remove("active");
        menu.setAttribute("aria-selected", "false");
      });
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
  mainMenuPC.init();
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
  mainMenuPC.closeMainMenu();
});

// 리사이즈 이벤트
window.addEventListener("resize", () => {
  windowSize.setWinSize();
});

//메인 배너
const vbSwiper = new Swiper(".vb-swiper .swiper", {
  slidesPerView: 1,
  spaceBetween: 16,
  speed: 700,
  loop: true,
  breakpoints: {
    100: {
      slidesPerView: 1,
    },
    767: {
      slidesPerView: 2,
    },
    1025: {
      slidesPerView: 1,
    },
  },
  autoplay: {
    delay: 2500,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
  },

  navigation: {
    nextEl: ".vb-swiper .swiper-button-next",
    prevEl: ".vb-swiper .swiper-button-prev",
  },
  pagination: {
    el: ".vb-swiper .swiper-pagination",
    type: "fraction",
  },
});

const $vbSwiperPlay = document.querySelector(".vb-swiper .swiper-button-play");
const $vbSwiperStop = document.querySelector(".vb-swiper .swiper-button-stop");
$vbSwiperPlay.style.display = "none";
$vbSwiperPlay.addEventListener("click", () => {
  vbSwiper.autoplay.start();
  $vbSwiperStop.style.display = "";
  $vbSwiperPlay.style.display = "none";
});
$vbSwiperStop.addEventListener("click", () => {
  vbSwiper.autoplay.stop();
  $vbSwiperStop.style.display = "none";
  $vbSwiperPlay.style.display = "";
});

//팝업레이어 슬라이드
const popupSwiper = new Swiper(".popup-swiper .swiper", {
  slidesPerView: 1,
  spaceBetween: 16,
  speed: 700,
  loop: true,
  autoHeight: true,
  autoplay: {
    delay: 2500,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
  },

  navigation: {
    nextEl: ".popup-swiper .swiper-button-next",
    prevEl: ".popup-swiper .swiper-button-prev",
  },
  pagination: {
    el: ".popup-swiper .swiper-pagination",
    type: "fraction",
  },
});
const $popupSwiperPlay = document.querySelector(
  ".popup-swiper .swiper-button-play"
);
const $popupSwiperStop = document.querySelector(
  ".popup-swiper .swiper-button-stop"
);
$popupSwiperPlay.style.display = "none";
$popupSwiperPlay.addEventListener("click", () => {
  popupSwiper.autoplay.start();
  $popupSwiperStop.style.display = "";
  $popupSwiperPlay.style.display = "none";
});
$popupSwiperStop.addEventListener("click", () => {
  popupSwiper.autoplay.stop();
  $popupSwiperStop.style.display = "none";
  $popupSwiperPlay.style.display = "";
});
