const views = [...document.querySelectorAll("[data-view]")];
const pageShell = document.querySelector(".page-shell");
let activeView = "home";

function showView(name, animate = true) {
  const next = views.some((view) => view.dataset.view === name) ? name : "home";
  activeView = next;
  views.forEach((view) => {
    const active = view.dataset.view === next;
    view.hidden = !active;
    if (active && animate) {
      view.classList.remove("view-enter");
      requestAnimationFrame(() => view.classList.add("view-enter"));
    }
  });
  pageShell.classList.toggle("module-open", next !== "home");
  document.title = next === "home" ? "Yuan Studio | Frontend Notes & Works" : `${next[0].toUpperCase()}${next.slice(1)} | Yuan Studio`;
}

function routeFromLocation() {
  showView(window.location.hash.slice(1) || "home", true);
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[href^='#']");
  if (!link) return;
  const next = link.getAttribute("href").slice(1) || "home";
  if (!views.some((view) => view.dataset.view === next)) return;
  event.preventDefault();
  if (window.location.hash !== `#${next}`) window.location.hash = next;
  else showView(next, true);
});

window.addEventListener("hashchange", routeFromLocation);
routeFromLocation();

const loaderState = document.querySelector(".model-loading");
const loaderText = document.querySelector(".loading-copy");
const loaderPercent = document.querySelector(".loading-percent");
const loaderTrack = document.querySelector(".loading-track span");
const portrait = document.querySelector(".portrait-wrap");
const portraitModel = document.querySelector(".portrait-model");

function showPortraitError(error) {
  console.error("3D portrait failed to load:", error);
  loaderState.classList.remove("is-loading");
  loaderState.classList.add("is-error");
  loaderText.textContent = "3D 模型暂不可用，当前显示头像预览";
  loaderPercent.textContent = "";
  window.setTimeout(() => loaderState.classList.remove("is-error"), 3200);
}

async function activateModelCache() {
  if (!("serviceWorker" in navigator)) return;

  try {
    await navigator.serviceWorker.register("./sw.js");
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) return;

    await new Promise((resolve) => {
      const timeout = window.setTimeout(resolve, 2000);
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.clearTimeout(timeout);
        resolve();
      }, { once: true });
    });
  } catch (error) {
    console.warn("Portrait cache could not be enabled:", error);
  }
}

async function renderPortrait() {
  loaderState.classList.add("is-loading");
  try {
    await activateModelCache();
    await new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("3D viewer did not load")), 8000);
      customElements.whenDefined("model-viewer").then(() => {
        window.clearTimeout(timeout);
        resolve();
      });
    });

    portraitModel.addEventListener("progress", (event) => {
      if (portrait.classList.contains("model-ready")) return;
      const percent = Math.round(event.detail.totalProgress * 100);
      loaderPercent.textContent = `${percent}%`;
      loaderTrack.style.width = `${percent}%`;
      loaderText.textContent = "正在载入 3D 半身像";
    });
    portraitModel.addEventListener("load", () => {
      portrait.classList.add("model-ready");
      loaderTrack.style.width = "100%";
      loaderPercent.textContent = "100%";
      loaderText.textContent = "3D 半身像已就绪";
      window.setTimeout(() => loaderState.classList.remove("is-loading"), 650);
    }, { once: true });
    portraitModel.addEventListener("error", (event) => {
      showPortraitError(event.detail?.sourceError || new Error("3D model could not be loaded"));
    }, { once: true });
    portraitModel.src = "3d-model/generated_model_20261109_103623.glb";
  } catch (error) {
    showPortraitError(error);
  }
}

renderPortrait();
