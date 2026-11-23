globalThis.CHECK_PROGRAMS = {
  go: { label: "Go", file: "check.go", command: "go run check.go" },
  rust: { label: "Rust", file: "check.rs", command: "rustc check.rs -o check && ./check" },
  dart: { label: "Dart", file: "check.dart", command: "dart run check.dart" },
  zig: { label: "Zig 0.15.2", file: "check.zig", command: "zig run check.zig" },
  python: { label: "Python", file: "check.py", command: "python3 check.py" },
  java: { label: "Java", file: "Check.java", command: "java Check.java" }
};
