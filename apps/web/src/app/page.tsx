import Link from "@repo/fiker/link";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    document.body.style.padding = "0";
    document.body.style.margin = "0";

    return () => {
      document.body.style.padding = "";
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
        color: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 1rem",
      }}
    >
      <div
        style={{
          maxWidth: "56rem",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "4rem",
            fontWeight: "bold",
            marginBottom: "1.5rem",
          }}
        >
          Fiker
        </h1>
        <p
          style={{
            fontSize: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          Fiker means "Love" in Amharic - A Static Site Generator Built with
          Love
        </p>
        <p
          style={{
            fontSize: "1.25rem",
            marginBottom: "3rem",
          }}
        >
          A blazing fast static site generator powered by Vite, generating
          optimized HTML at build time with built-in markdown support
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "2rem",
            marginBottom: "3rem",
          }}
        >
          <div
            style={{
              background: "#f5f5f5",
              padding: "1.5rem",
              borderRadius: "4px",
              border: "1px solid #eee",
            }}
          >
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                marginBottom: "0.75rem",
              }}
            >
              📄 Static by Default
            </h3>
            <p>
              Generates optimized static HTML at build time for better
              performance
            </p>
          </div>
          <div
            style={{
              background: "#f5f5f5",
              padding: "1.5rem",
              borderRadius: "4px",
              border: "1px solid #eee",
            }}
          >
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                marginBottom: "0.75rem",
              }}
            >
              ⚡️ Zero JavaScript
            </h3>
            <p>Ships minimal JavaScript for maximum performance</p>
          </div>
          <div
            style={{
              background: "#f5f5f5",
              padding: "1.5rem",
              borderRadius: "4px",
              border: "1px solid #eee",
            }}
          >
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                marginBottom: "0.75rem",
              }}
            >
              🚀 SEO Optimized
            </h3>
            <p>
              Perfect for content-focused sites with great SEO out of the box
            </p>
          </div>
        </div>

        <Link
          to="/about"
          style={{
            display: "inline-block",
            padding: "1rem 2rem",
            background: "#000",
            color: "#fff",
            borderRadius: "4px",
            fontSize: "1.125rem",
            fontWeight: "600",
            textDecoration: "none",
          }}
        >
          Learn More About Fiker
        </Link>
      </div>
    </div>
  );
}
