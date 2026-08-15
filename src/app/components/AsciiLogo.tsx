import { ASCII_LOGO } from "@/config/asciiLogo";

export default function AsciiLogo() {
  return (
    <pre className="paper-ascii" aria-label="asianpaper">
      {ASCII_LOGO}
    </pre>
  );
}
