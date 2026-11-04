# EveryO developer quickstart

Canonical HTML: https://krishanth7.github.io/everyo-site/documentation.html
Project source: https://github.com/krishanth7/EveryO
Reviewed source revision: 6c05a061eb62fa2646e726d15cac07053d04c79e
License: MIT

This is a text companion to the developer website. The upstream source and
its docstrings remain authoritative. Examples assume Python 3.9–3.12 and the
NumPy CPU workflow. No account or API key is required. Installation downloads
packages; locally generated datasets do not require downloads.

# Getting started

This guide takes about five minutes and assumes Python 3.9 or newer.

## Install

```bash
git clone https://github.com/krishanth7/EveryO.git
cd EveryO
python -m venv .venv
```

Activate the environment — on Linux/macOS:

```bash
source .venv/bin/activate
```

On Windows (PowerShell):

```powershell
.venv\Scripts\Activate.ps1
```

Then install EveryO in editable mode:

```bash
pip install -e .
```

Check that everything works:

```bash
everyo info
everyo doctor
```

`doctor` verifies that the numerics are correct (it runs a real gradient check)
and reports which optional components are present. Neither command sends
anything anywhere; EveryO collects no telemetry.

## Your first tensor

```python
import everyo as eo

x = eo.tensor([[1.0, 2.0]])
y = eo.tensor([[3.0], [4.0]])

print(eo.matmul(x, y))
# Tensor([[11.]], shape=(1, 1), dtype=float32)
```

Tensors expose the properties you would expect:

```python
x.shape  # (1, 2)
x.ndim  # 2
x.dtype  # 'float32'
x.device  # device('cpu')
x.size  # 2
```

## Gradients

Mark a tensor with `requires_grad=True` and EveryO records every operation
applied to it. Calling `.backward()` on a scalar result fills in `.grad`:

```python
x = eo.tensor([2.0], requires_grad=True)
y = x * x
y.backward()

print(x.grad)  # [4.]   because d(x^2)/dx = 2x
```

Wrap inference in `eo.no_grad()` to skip graph construction entirely:

```python
with eo.no_grad():
    predictions = model(features)
```

## A small network

```python
import everyo as eo

model = eo.Sequential(
    eo.Linear(4, 16),
    eo.ReLU(),
    eo.Linear(16, 3),
)

print(model.summary())
```

## Training it

```python
import everyo as eo
from everyo.datasets import make_blobs

features, labels = make_blobs(n_samples=600, n_features=4, centers=3, seed=0)
x_train, x_test, y_train, y_test = eo.stratified_split(features, labels, test_size=0.2, seed=0)

model = eo.Sequential(eo.Linear(4, 16, seed=0), eo.ReLU(), eo.Linear(16, 3, seed=1))

trainer = eo.Trainer(
    model=model,
    optimizer=eo.Adam(model.parameters(), lr=0.01),
    loss_fn=eo.CrossEntropyLoss(),
    metrics=["accuracy"],
)

history = trainer.fit(
    eo.DataLoader(eo.ArrayDataset(x_train, y_train), batch_size=32, shuffle=True, seed=0),
    epochs=20,
    validation_loader=eo.DataLoader(eo.ArrayDataset(x_test, y_test), batch_size=64),
)

print(trainer.evaluate(eo.DataLoader(eo.ArrayDataset(x_test, y_test), batch_size=64)))
```

## A convolutional network

Images are `NHWC` — `(batch, height, width, channels)` — so a single-channel
8x8 image batch has shape `(n, 8, 8, 1)`:

This separate architecture is named `cnn` so the trained `model` above remains
available for evaluation and saving.

```python
cnn = eo.Sequential(
    eo.Conv2D(1, 8, 3, padding="same"),
    eo.ReLU(),
    eo.MaxPool2D(2),
    eo.Conv2D(8, 16, 3, padding="same"),
    eo.ReLU(),
    eo.MaxPool2D(2),
    eo.Flatten(),
    eo.Linear(2 * 2 * 16, 10),
)
```

`padding` accepts `"valid"`, `"same"` or an int, and `stride` accepts an int or
a `(height, width)` pair. See `examples/convolutional_network.py`.

## Charts, saving and loading

```python
from pathlib import Path

Path("artifacts").mkdir(exist_ok=True)
eo.plot_history(history, save_path="artifacts/history.png")

eo.save(model, "artifacts/model.evo")
restored = eo.load("artifacts/model.evo")
```

Charts work without a display: on a headless machine EveryO selects the
non-interactive Agg backend automatically.

## Where to go next

* [Architecture](https://github.com/krishanth7/EveryO/blob/main/docs/architecture.md) — how the package fits together.
* [Autograd](https://github.com/krishanth7/EveryO/blob/main/docs/autograd.md) — how the gradient engine works.
* [CUDA](https://github.com/krishanth7/EveryO/blob/main/docs/cuda.md) — building and using the optional GPU kernels.
* `examples/` — runnable scripts covering every feature.

## Verification and scope

EveryO is for learning, teaching, and small-scale experiments, not a production
training runtime. GPU runtime validation requires hardware absent from project CI.
Multi-machine training has not been validated. Exported ONNX graphs must be
checked against their target runtime. Reported example metrics are measurements,
not performance guarantees. See https://krishanth7.github.io/everyo-site/features.html#validation.

## Continue reading

- Full AI reference: https://krishanth7.github.io/everyo-site/llms-full.txt
- AI discovery index: https://krishanth7.github.io/everyo-site/llms.txt
- Examples: https://krishanth7.github.io/everyo-site/examples.html
- Support: https://github.com/krishanth7/EveryO/blob/main/SUPPORT.md
