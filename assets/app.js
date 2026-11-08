/* 旧页面用的小脚本：复制提取码。首页交互在 site.js。无依赖、无构建。 */

(function () {
  "use strict";

  /* ---------- 导航吸顶 ---------- */
  var nav = document.getElementById("nav");
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle("is-stuck", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- 复制提取码 ---------- */
  function bindCopy(btn) {
    if (!btn) return;
    btn.addEventListener("click", function () {
      var pwd = btn.getAttribute("data-pwd") || "";
      var old = btn.textContent;
      var done = function () {
        btn.textContent = "已复制";
        setTimeout(function () { btn.textContent = old; }, 1600);
      };
      var fallback = function () {
        var ta = document.createElement("textarea");
        ta.value = pwd;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); done(); } catch (e) { /* 忽略 */ }
        document.body.removeChild(ta);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(pwd).then(done, fallback);
      } else {
        fallback();
      }
    });
  }

  var copyButtons = document.querySelectorAll("[data-pwd]");
  for (var i = 0; i < copyButtons.length; i++) bindCopy(copyButtons[i]);

  /* ---------- 版本号 ---------- */
  fetch("/api/update.json")
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || !data.latest_version) return;
      var nodes = document.querySelectorAll("[data-version]");
      for (var i = 0; i < nodes.length; i++) nodes[i].textContent = data.latest_version;
    })
    .catch(function () { /* 静态站没有接口，用构建时的版本号 */ });
})();
