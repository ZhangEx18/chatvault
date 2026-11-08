/* 聊天档案官网交互：导出控制台、入场动效、复制提取码。无依赖、无构建。 */

(function () {
  "use strict";

  /* ---------- 真实导出文件清单 ----------
     数字来自本机真实导出：小A 的 3 条消息，2025-01-01。
     不编造大小或摘要；文件就在 assets/formats/ 里，可以直接下载。 */
  var FILES = {
    html: { label: "HTML", bytes: 2741, sha: "cf432fbb0d16", href: "assets/formats/sample.html", open: "打开这份归档" },
    pdf: { label: "PDF", bytes: 18348, sha: "e211188cc734", href: "assets/formats/sample.pdf", open: "打开 PDF" },
    xlsx: { label: "Excel", bytes: 5232, sha: "8d10ea5c4e60", href: "assets/formats/sample.xlsx", open: "打开 Excel" },
    json: { label: "JSON", bytes: 1337, sha: "cfe4de6842fb", href: "assets/formats/sample.json", open: "打开 JSON" },
    md: { label: "Markdown", bytes: 123, sha: "aaa90240ece3", href: "assets/formats/sample.md", open: "打开 Markdown" },
    csv: { label: "CSV", bytes: 158, sha: "9413e3419432", href: "assets/formats/sample.csv", open: "打开 CSV" },
    txt: { label: "TXT", bytes: 416, sha: "8cd6652234b6", href: "assets/formats/sample.txt", open: "打开 TXT" }
  };
  var REAL_COUNT = 3;

  // 首页七行格式的「字节数 + SHA256」直接来自同一份数据，避免与格式清单脱节
  (function paintFormatMeta() {
    var nodes = [].slice.call(document.querySelectorAll("[data-fmt-meta]"));
    nodes.forEach(function (el) {
      var key = el.getAttribute("data-fmt-meta");
      var meta = FILES[key];
      if (!meta) return;
      el.textContent = meta.bytes.toLocaleString("en-US") + " 字节 · SHA256 " + meta.sha + "…";
    });
  })();

  function bytes(n) {
    return n < 1024 ? n + " B" : (n / 1024).toFixed(1).replace(".0", "") + " KB";
  }

  /* ---------- 导出控制台 ---------- */
  var box = document.getElementById("console");
  if (box) {
    var rows = [].slice.call(box.querySelectorAll(".console__row"));
    var fmtButtons = [].slice.call(box.querySelectorAll(".console__formats button"));
    var stateEl = document.getElementById("consoleState");
    var barEl = document.getElementById("bar");
    var runBtn = document.getElementById("runExport");
    var resultEl = document.getElementById("result");
    var doneBox = document.getElementById("doneBox");
    var doneMsg = document.getElementById("doneMsg");
    var doneSize = document.getElementById("doneSize");
    var doneHash = document.getElementById("doneHash");
    var doneLink = document.getElementById("doneLink");
    var scaleNote = document.getElementById("scaleNote");
    var fmt = "html";
    var busy = false;

    function selection() {
      var picked = rows.filter(function (r) { return r.getAttribute("data-on") === "1"; });
      var count = 0;
      picked.forEach(function (r) { count += Number(r.getAttribute("data-count") || 0); });
      return { rows: picked.length, messages: count };
    }

    function paintState() {
      var sel = selection();
      stateEl.textContent = "已选 " + sel.rows + " 个会话 · " + sel.messages + " 条消息";
      runBtn.disabled = sel.rows === 0 || busy;
      if (sel.rows === 0) stateEl.textContent = "没选会话，勾一个再导出";
    }

    function toggleRow(row) {
      if (busy) return;
      var on = row.getAttribute("data-on") === "1";
      row.setAttribute("data-on", on ? "0" : "1");
      row.setAttribute("aria-checked", on ? "false" : "true");
      resultEl.setAttribute("data-state", "idle");
      doneBox.hidden = true;
      barEl.style.width = "0%";
      paintState();
    }

    rows.forEach(function (row) {
      row.addEventListener("click", function () { toggleRow(row); });
      row.addEventListener("keydown", function (e) {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggleRow(row); }
      });
    });

    fmtButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (busy) return;
        fmtButtons.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        btn.setAttribute("aria-pressed", "true");
        fmt = btn.getAttribute("data-fmt");
        resultEl.setAttribute("data-state", "idle");
        doneBox.hidden = true;
        barEl.style.width = "0%";
      });
    });

    var timers = [];
    function stopTimers() { timers.forEach(clearTimeout); timers = []; }

    function finish() {
      var meta = FILES[fmt] || FILES.html;
      var sel = selection();
      doneMsg.textContent = "导出完成 · 小A 的 " + REAL_COUNT + " 条消息";
      doneSize.textContent = meta.label + " · " + bytes(meta.bytes) + " · " + meta.bytes.toLocaleString("en-US") + " 字节";
      doneHash.textContent = "SHA256 " + meta.sha + "…";
      doneLink.href = meta.href;
      doneLink.textContent = meta.open;
      scaleNote.hidden = sel.rows <= 1;
      doneBox.hidden = false;
      resultEl.setAttribute("data-state", "done");
      barEl.style.width = "100%";
      runBtn.textContent = "再导一次";
    }

    runBtn.addEventListener("click", function () {
      if (busy) return;
      stopTimers();
      var sel = selection();
      if (!sel.rows) return;
      busy = true;
      runBtn.disabled = true;
      doneBox.hidden = true;
      resultEl.setAttribute("data-state", "running");
      runBtn.textContent = "导出中…";
      barEl.style.width = "16%";
      timers.push(setTimeout(function () { barEl.style.width = "42%"; }, 260));
      timers.push(setTimeout(function () { barEl.style.width = "68%"; }, 700));
      timers.push(setTimeout(function () { barEl.style.width = "88%"; }, 1150));
      timers.push(setTimeout(finish, 1700));
      timers.push(setTimeout(function () {
        busy = false;
        runBtn.disabled = false;
        paintState();
      }, 1900));
    });

    paintState();
  }

  /* ---------- 入场动效：内容默认可见，用 Web Animations 播放入场 ----------
     没有脚本、脚本报错或 prefers-reduced-motion 时，页面就是完整的静态内容。 */
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var groups = [
    { sel: ".board__row, .board__open", dx: 0, dy: 18, step: 60 },
    { sel: ".pair__say > *", dy: 16, step: 70 },
    { sel: ".formats .format", dx: 14, dy: 0, step: 55 },
    { sel: ".guard__row", dy: 14, step: 55 },
    { sel: ".steps > li", dy: 18, step: 65 },
    { sel: ".plans .plan", dy: 16, step: 60 },
    { sel: ".dl-group", dy: 16, step: 70 },
    { sel: ".qa details", dy: 12, step: 45 },
    { sel: ".shots figure", dy: 18, step: 65 },
    { sel: "table.spec, .callout", dy: 14, step: 0 },
    { sel: ".speech > *", dy: 14, step: 60 }
  ];

  if (!prefersReduced && "IntersectionObserver" in window && typeof Element.prototype.animate === "function") {
    groups.forEach(function (g) {
      var list = [].slice.call(document.querySelectorAll(g.sel));
      if (!list.length) return;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var i = list.indexOf(el);
          io.unobserve(el);
          // fill: "backwards" 让延迟期间保持首帧透明，不写内联样式，脚本中断也不会留下隐形内容
          el.animate(
            [{ opacity: 0, transform: "translate(" + (g.dx || 0) + "px, " + g.dy + "px)" }, { opacity: 1, transform: "none" }],
            { duration: 620, delay: Math.min(i, 4) * g.step, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" }
          );
        });
      }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
      list.forEach(function (el) { io.observe(el); });
    });
  }

  /* ---------- 语音识别进度条：进入视口时走一次 ---------- */

  var meter = document.getElementById("meter");
  if (meter && !prefersReduced) {
    var mbar = meter.querySelector(".bar i");
    var seen = false;
    var mio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !seen) {
          seen = true;
          meter.setAttribute("data-run", "1");
          mio.disconnect();
        }
      });
    }, { threshold: 0.4 });
    if (mbar) mio.observe(meter);
  } else if (meter) {
    meter.setAttribute("data-run", "1");
  }

  /* ---------- 大图缓慢漂移（唯一的“动起来的图”） ---------- */

  var drift = document.querySelector(".shot--drift img");
  if (drift && !prefersReduced) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var r = drift.getBoundingClientRect();
        var progress = (window.innerHeight - r.top) / (window.innerHeight + r.height);
        var p = Math.max(0, Math.min(1, progress));
        drift.style.transform = "scale(1.045) translateY(" + (-14 + p * 20).toFixed(1) + "px)";
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- 录屏：进入视口才播，离开就停（减少后台解码） ---------- */

  var film = document.querySelector(".run-film video");
  if (film) {
    if (prefersReduced) {
      film.removeAttribute("autoplay");
      film.pause();
    } else if ("IntersectionObserver" in window) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var played = film.play();
            if (played && played.catch) played.catch(function () { /* 自动播放被拦时保留封面 */ });
          } else if (!film.paused) {
            film.pause();
          }
        });
      }, { threshold: 0.35 });
      vio.observe(film);
    }
  }

  /* ---------- 复制提取码 ---------- */

  function bindCopy(btn) {
    var pwd = btn.getAttribute("data-pwd") || "";
    if (!pwd) return;
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
    btn.addEventListener("click", function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(pwd).then(done, fallback);
      } else {
        fallback();
      }
    });
  }

  [].slice.call(document.querySelectorAll("[data-pwd]")).forEach(bindCopy);

  /* ---------- 导航吸顶反馈 ---------- */

  var nav = document.getElementById("nav");
  if (nav) {
    var paint = function () {
      nav.classList.toggle("is-stuck", window.scrollY > 6);
    };
    paint();
    window.addEventListener("scroll", paint, { passive: true });
  }
})();
