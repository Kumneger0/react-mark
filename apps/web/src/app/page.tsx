import Link from "@repo/fiker/link";
import React from "react";

export default function Home() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#f0f0f0",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h1
        style={{ fontSize: "36px", fontWeight: "bold", marginBottom: "20px" }}
      >
        Welcome to Our Website
      </h1>
      <p style={{ fontSize: "18px", color: "#007bff", marginBottom: "20px" }}>
        Explore our pages to learn more about us and what we do.
      </p>
      <Link
        to="/about"
        style={{
          textDecoration: "none",
          fontWeight: "bold",
          padding: "10px 20px",
          borderRadius: "20px",
          backgroundColor: "#007bff",
          color: "white",
          display: "inline-block",
        }}
      >
        Visit About Page
      </Link>
    </div>
  );
}
