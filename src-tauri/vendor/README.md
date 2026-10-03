# Pinned GLib security backport

`glib/` is crates.io glib 0.18.5, retained with its MIT license and upstream metadata.
Cargo.toml pins it through `[patch.crates-io]`; the version has not been relabelled.
Only `src/variant_iter.rs` differs from upstream source: `let p` → `let mut p`
and the variadic C out argument `&p` → `&mut p` in `VariantStrIter::impl_get`.

Upstream fix: https://github.com/gtk-rs/gtk-rs-core/pull/1343
Advisory: https://rustsec.org/advisories/RUSTSEC-2024-0429.html
Tauri's Linux GTK stack still requires the 0.18 ABI, preventing an isolated 0.20 bump.
No RustSec advisory is blanket-ignored. The path source is not represented as an
unpatched crates.io glib in cargo-audit; this is not by itself proof of remediation.

Proof: `cargo test --release --manifest-path src-tauri/Cargo.toml patched_glib_string_iterator_optimized_regression`
checks 10,000 mixed forward/backward iterator traversals with optimizations.
Do not remove the local patch until the GTK stack consumes a patched upstream version.
