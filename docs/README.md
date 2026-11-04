# EveryO documentation

Build, train, evaluate, and inspect neural networks locally. Start with the CPU
workflow, then add optional backends for the experiments you need.

## Choose a workflow

| Goal | Guide |
| --- | --- |
| Install and train your first model | [Getting started](getting-started.md) |
| Understand gradients and implementation boundaries | [Autograd](autograd.md) and [Architecture](architecture.md) |
| Explore export, mixed precision, and distributed execution | [Scaling](scaling.md) |
| Build the optional native backend | [CUDA](cuda.md) |
| Diagnose installation and command-line output | [Troubleshooting](troubleshooting.md) |

## Reference

* [Getting started](getting-started.md) — install, first tensor, first network.
* [Architecture](architecture.md) — how the package is layered and why.
* [Autograd](autograd.md) — how the gradient engine works and how it is verified.
* [Scaling](scaling.md) — mixed precision, ONNX export and data-parallel training.
* [CUDA](cuda.md) — building, using and benchmarking the optional GPU kernels.
* [API reference](api-reference.md) — a map of the public surface.

Runnable code lives in [`../examples`](../examples); benchmark scripts live in
[`../benchmarks`](../benchmarks).
