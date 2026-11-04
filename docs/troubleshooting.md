# Installation and diagnostics

Run commands from the repository root with the virtual environment activated.
Use `python -m pip` to install into the same interpreter used by your examples.

## Verify the environment

```bash
python -m pip install -e .
everyo info
everyo doctor
```

`info` reports versions and available backends. `doctor` also performs a core
gradient check. Missing TensorFlow or CUDA is expected in a CPU installation.
An optional backend being detected does not establish its numerical correctness
on your hardware; run the relevant tests before relying on it.

## Common problems

| Symptom | Next step |
| --- | --- |
| `everyo` command not found | Activate the environment and repeat the editable installation. |
| `pytest` is unavailable | Install development dependencies with `python -m pip install -e ".[dev]"`. |
| CUDA is unavailable | Follow [CUDA setup](cuda.md); the core CPU path does not require the native extension. |
| ONNX import fails | Install `python -m pip install -e ".[onnx]"` in the active environment. |
| Charts cannot open a window | Save charts to files; headless execution uses the Agg backend. |
| Distributed example runs slowly | Limit BLAS worker threads as described in the [example catalog](../examples/README.md). |

## Machine-readable reports

```bash
everyo info --json
everyo benchmark --sizes 32 --repeats 1 --json --output artifacts/benchmark.json
```

With `--json`, benchmark stdout contains only the JSON result. When `--output`
is also supplied, the file confirmation goes to stderr so stdout can be piped
to another program. Timing results depend on hardware, load, and backend;
retain the environment report alongside measurements.

## Report a reproducible problem

Include the EveryO version or commit, operating system, command, traceback,
and a small example using generated data. Include relevant `everyo info`
output after reviewing it for information you do not want to share publicly.
Use [Support](../SUPPORT.md) for help and [Security](../SECURITY.md) for private
vulnerability reporting.
