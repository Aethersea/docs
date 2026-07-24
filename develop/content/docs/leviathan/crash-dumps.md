---
title: "Crash dumps & native backtraces"
description: "Collect native Windows backtraces and crash dumps for Leviathan debugging."
---

Leviathan's hot paths (DXGI capture, NVENC, GPU cursor compositing, audio
capture, clipboard helper IPC) all run inside cgo C/C++ code. A fault
there does **not** produce a Go panic — Windows just terminates the
process, leaving "[Service] Child exited (PID N)" as the only forensic
trace, and the client sees `wsarecv: An existing connection was forcibly
closed by the remote host` from the loopback gRPC stream.

Two complementary mechanisms are wired in to recover real diagnostic
data when this happens:

## 1. Native VEH backtrace in `leviathan.log`

`internal/crash/crash_windows.c` installs a first-chance
[Vectored Exception Handler](https://learn.microsoft.com/en-us/windows/win32/debug/vectored-exception-handling)
at process startup. On any fatal hardware exception
(`EXCEPTION_ACCESS_VIOLATION`, `EXCEPTION_ILLEGAL_INSTRUCTION`,
`EXCEPTION_STACK_OVERFLOW`, `EXCEPTION_IN_PAGE_ERROR`,
`EXCEPTION_PRIV_INSTRUCTION`, `EXCEPTION_ARRAY_BOUNDS_EXCEEDED`,
`EXCEPTION_NONCONTINUABLE_EXCEPTION`) it dumps:

- exception code + faulting instruction address
- access-violation read/write + target VA
- faulting module + offset (e.g. `nvwgf2umx.dll+0x12345`)
- native callstack with `dbghelp` symbol resolution (best-effort —
  PDBs must be on the symbol search path for names; module+offset
  always works)

…and then returns `EXCEPTION_CONTINUE_SEARCH`, so the OS still
terminates the process and WER still writes its minidump. The output
lands on `stderr`, which for the child process is the inherited
`leviathan.log` handle. Example:

```
=== [CrashLog] fatal exception ACCESS_VIOLATION (0xC0000005) at 0x7FF8C0123456 — 2026-05-20T07:52:00Z ===
[CrashLog] AV read at 0x0000000000000018
[CrashLog] PID=29880 TID=14552
[CrashLog] Faulting module: C:\Windows\System32\dxgi.dll + 0x23456
[CrashLog] Native backtrace (12 frames):
  [ 0] 0x00007FF8C0123456  dxgi.dll+0x23456
  [ 1] 0x00007FF7A2345678  leviathan.exe+0x45678
  ...
=== [CrashLog] end of fatal exception ===
```

The handler runs **once** per process (re-entry from a fault inside the
handler itself is silently dropped). No configuration is required — it
is unconditionally installed at the top of `main()`.

## 2. Windows Error Reporting LocalDumps

Even with a native backtrace in the log, a full minidump is invaluable
for offline analysis: it has every D3D11 texture handle, every NVENC
encoder state buffer, every gRPC stream's in-flight bytes, every
goroutine's register set.

The supervisor's `service install` path automatically writes the
required registry keys. To configure it on an already-installed system
(or to change the dump folder), run from an **elevated** shell:

```powershell
leviathan service configure-crash-dumps                            # default folder
leviathan service configure-crash-dumps --folder D:\Dumps          # custom
```

This writes:

```
HKLM\SOFTWARE\Microsoft\Windows\Windows Error Reporting\LocalDumps\leviathan.exe
  DumpFolder = %ProgramData%\Leviathan\CrashDumps   (REG_EXPAND_SZ)
  DumpCount  = 10                                   (REG_DWORD)
  DumpType   = 2  (full dump)                       (REG_DWORD)
```

`DumpType = 2` (Full) is required: the default minidump (`1`) omits
process heap memory, which is where the D3D resources and NVENC state
the suspected crashes touch actually live.

## Analyzing a dump

Open the `.dmp` in WinDbg or `cdb`:

```powershell
cdb -z C:\ProgramData\Leviathan\CrashDumps\leviathan.exe.29880.dmp
0:000> !analyze -v
0:000> ~* kn 30          # all threads, top 30 frames each
```

Symbol path setup (point at the public MS symbol server + your local
build):

```powershell
.sympath srv*C:\symbols*https://msdl.microsoft.com/download/symbols;<your_build_dir>
.reload /f
```

If the build was made without PDBs (the standard `make build` strips
them), look at the matching `leviathan.exe~` artifact in `build/` or
rebuild with `-gcflags="all=-N -l"` for unoptimised Go frames; for C
frames, point clang at `-g -gcodeview` and recompile.

## Why both?

A textual backtrace in the log triages 80 % of crashes — module + offset
is enough to identify "yes, this is the NVENC removed-device crash" vs
"the cursor capture STA died" vs "something in our own pipeline_windows.go
cgo callback". The full minidump exists for the remaining 20 % where you
need to walk D3D resource lifetimes or stare at the GPU's command queue.
