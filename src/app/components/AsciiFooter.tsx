import { ASCII_FOOTER } from "@/config/asciiFooter";

export default function AsciiFooter() {
  return (
    <pre className="ascii-footer-art" aria-hidden="true">
      {ASCII_FOOTER}
    </pre>
  );
}
