"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";

function NotFoundNotice() {
  const searchParams = useSearchParams();
  if (!searchParams.get("notfound")) return null;
  return <p className={styles.notice}>존재하지 않는 링크입니다.</p>;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShortUrl(null);
    setCopied(false);

    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "알 수 없는 오류가 발생했습니다.");
        return;
      }

      setShortUrl(`${window.location.origin}/${data.code}`);
    } catch {
      setError("요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!shortUrl) return;

    let ok = false;
    try {
      await navigator.clipboard.writeText(shortUrl);
      ok = true;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = shortUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      document.body.removeChild(textarea);
    }

    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } else {
      setError("복사에 실패했습니다. 직접 선택해서 복사해주세요.");
    }
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>URL Shortener</h1>
      <Suspense fallback={null}>
        <NotFoundNotice />
      </Suspense>

      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          className={styles.input}
          type="text"
          placeholder="https://example.com/very/long/link"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? "생성 중..." : "단축하기"}
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      {shortUrl && (
        <div className={styles.result}>
          <a href={shortUrl} target="_blank" rel="noreferrer">
            {shortUrl}
          </a>
          <button
            className={`${styles.copyButton} ${copied ? styles.copyButtonSuccess : ""}`}
            onClick={handleCopy}
          >
            {copied ? "✓ 복사됨" : "복사"}
          </button>
        </div>
      )}
    </main>
  );
}
