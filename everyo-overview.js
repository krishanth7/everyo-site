/* Documented examples; these snippets do not execute Python in the browser. */
(function () {
  "use strict";
  var examples = {
    tensors: {
      filename: "tensor_basics.py",
      code: "import everyo as eo\n\nx = eo.tensor([[1.0, 2.0]])\ny = eo.tensor([[3.0], [4.0]])\n\nprint(eo.matmul(x, y))",
      output: "Tensor([[11.]], shape=(1, 1), dtype=float32)",
      visual: "[1, 2] × [3, 4]ᵀ", result: "11",
      heading: "Small tensors. Clear results.",
      explanation: "Matrix multiplication combines two tensors. This documented example produces a single value: 1 × 3 + 2 × 4 = 11."
    },
    gradients: {
      filename: "first_gradient.py",
      code: "import everyo as eo\n\nx = eo.tensor([2.0], requires_grad=True)\ny = x * x\ny.backward()\n\nprint(x.grad)",
      output: "[4.]",
      visual: "y = x² · dy/dx = 2x", result: "4",
      heading: "Follow the gradient.",
      explanation: "EveryO records operations on tensors that require gradients. At x = 2, the derivative of x squared is 4. This output is documented in the getting-started guide."
    },
    networks: {
      filename: "small_network.py",
      code: "import everyo as eo\n\nmodel = eo.Sequential(\n    eo.Linear(4, 16, seed=0),\n    eo.ReLU(),\n    eo.Linear(16, 3, seed=1),\n)\n\nprint(model.num_parameters())",
      output: "131",
      visual: "4 inputs → 16 hidden → 3 outputs", result: "131",
      heading: "Compose a small network.",
      explanation: "Sequential connects two Linear layers through ReLU. The expected parameter count is derived from 4 × 16 + 16 biases, plus 16 × 3 + 3 biases: 131 parameters."
    }
  };
  var concepts = {
    tensor: { text: "Tensors hold numerical data, shapes, and device information. NumPy powers the core computation.", code: "x = eo.tensor([2.0], requires_grad=True)" },
    gradient: { text: "Operations record a computation graph. Calling backward propagates derivatives into the input tensors.", code: "y = x * x; y.backward()  # x.grad → [4.]" },
    network: { text: "Layers compose tensor operations into models. The same gradient engine connects those layers during training.", code: "model = eo.Sequential(eo.Linear(4, 3))" }
  };
  if (typeof module !== "undefined" && module.exports) module.exports = { examples: examples, concepts: concepts };
  if (typeof document === "undefined") return;
  var tabs = Array.from(document.querySelectorAll("[data-example]"));
  var code = document.getElementById("example-code");
  var status = document.getElementById("copy-status");
  var selected = "tensors";
  var copyGeneration = 0;
  function highlight(text) {
    var fragment = document.createDocumentFragment();
    var pattern = /#[^\n]*|"[^"\n]*"|'[^'\n]*'|\b(?:import|as|from|with|for|in|def|class|return|True|False|None)\b|\b\d+(?:\.\d+)?\b/g;
    var offset = 0, match;
    while ((match = pattern.exec(text))) {
      fragment.appendChild(document.createTextNode(text.slice(offset, match.index)));
      var span = document.createElement("span");
      span.className = match[0][0] === "#" ? "tok-comment" : /^["']/.test(match[0]) ? "tok-string" : /^\d/.test(match[0]) ? "tok-number" : "tok-keyword";
      span.textContent = match[0]; fragment.appendChild(span); offset = pattern.lastIndex;
    }
    fragment.appendChild(document.createTextNode(text.slice(offset)));
    code.replaceChildren(fragment);
  }
  function selectExample(key, focus) {
    if (!examples[key] || !code) return;
    selected = key; copyGeneration += 1;
    var example = examples[key];
    tabs.forEach(function (tab) { var active = tab.dataset.example === key; tab.setAttribute("aria-selected", String(active)); tab.tabIndex = active ? 0 : -1; if (active && focus) tab.focus(); });
    document.getElementById("example-panel").setAttribute("aria-labelledby", "tab-" + key);
    highlight(example.code);
    document.querySelector(".ov-code-filename").firstChild.textContent = example.filename + " ";
    document.getElementById("example-output").textContent = example.output;
    document.getElementById("example-visual").textContent = example.visual;
    document.getElementById("example-result").textContent = example.result;
    document.getElementById("example-heading").textContent = example.heading;
    document.getElementById("example-explanation").textContent = example.explanation;
    status.textContent = "";
  }
  tabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () { selectExample(tab.dataset.example, false); });
    tab.addEventListener("keydown", function (event) {
      var next = event.key === "ArrowRight" ? (index + 1) % tabs.length : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
      if (next >= 0) { event.preventDefault(); selectExample(tabs[next].dataset.example, true); }
    });
  });
  if (code) {
    selectExample(selected, false);
    document.getElementById("copy-code").addEventListener("click", async function () {
      var text = examples[selected].code, generation = ++copyGeneration;
      var copied = false, priorFocus = document.activeElement;
      try {
        if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); copied = true; }
      } catch (_) {}
      if (!copied) {
        var input = document.createElement("textarea");
        input.value = text; input.setAttribute("readonly", ""); input.setAttribute("aria-label", "Code to copy");
        input.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;opacity:0";
        document.body.appendChild(input); input.select();
        try { copied = document.execCommand("copy"); } catch (_) {}
        input.remove(); if (priorFocus) priorFocus.focus({ preventScroll: true });
      }
      if (generation === copyGeneration) status.textContent = copied ? "Code copied to clipboard." : "Copy was blocked. Select the code and copy it manually.";
    });
  }
  document.querySelectorAll("[data-concept]").forEach(function (button) {
    button.addEventListener("click", function () {
      var choice = concepts[button.dataset.concept];
      document.querySelectorAll("[data-concept]").forEach(function (other) { other.setAttribute("aria-pressed", String(other === button)); });
      document.getElementById("concept-explanation").textContent = choice.text;
      document.getElementById("concept-code").textContent = choice.code;
    });
  });
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var hero = document.querySelector(".ov-hero");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.target === hero) { hero.dataset.offscreen = String(!entry.isIntersecting || document.hidden); return; }
        if (entry.isIntersecting) { if (!reduced.matches) entry.target.classList.add("ov-revealed"); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll(".ov-section").forEach(function (section) { observer.observe(section); });
    if (hero) observer.observe(hero);
    document.addEventListener("visibilitychange", function () { if (hero) hero.dataset.offscreen = String(document.hidden || hero.getBoundingClientRect().bottom < 0); });
  }
  document.body.dataset.overviewReady = "true";
})();
