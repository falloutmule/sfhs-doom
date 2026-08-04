# Bounded P2 multi-file adapter fragment.
# Included only by P2 browser build orchestration; it never enables packaging.

set(SFHS_WASM_MULTI_FILE TRUE CACHE BOOL "SFHS P2 multi-file Wasm adapter")
set(SFHS_WASM_RUNTIME_MODE "loopback" CACHE STRING "SFHS P2 runtime mode")
set(SFHS_WASM_ADAPTER_FLAGS "ASYNCIFY;EXIT_RUNTIME=1" CACHE STRING "SFHS P2 adapter flags")
