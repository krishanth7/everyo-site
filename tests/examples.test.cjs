const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "../examples.html"), "utf8");

test("each published example has a version-pinned source link and a portable command", () => {
  const scripts = [
    "tensor_basics", "linear_regression", "neural_network",
    "binary_classification", "convolutional_network", "sequence_models",
    "save_and_load", "onnx_export", "profiling", "distributed_training",
    "mixed_precision", "quantization",
  ];
  for (const script of scripts) {
    assert.ok(
      html.includes(`https://github.com/krishanth7/EveryO/blob/v0.5.0/examples/${script}.py`),
      `missing versioned source for ${script}`,
    );
    assert.ok(
      html.includes(`data-command="python examples/${script}.py"`),
      `missing portable command for ${script}`,
    );
  }
  assert.match(html, /id="run-examples"/);
  assert.match(html, /git checkout v0\.5\.0/);
  assert.match(html, /python -m pip check/);
  assert.match(html, /Install the optional/);
});
