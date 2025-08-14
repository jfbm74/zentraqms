import React from "react";

interface SimpleLayoutProps {
  children: React.ReactNode;
}

const SimpleLayout: React.FC<SimpleLayoutProps> = ({ children }) => {
  return (
    <div className="simple-layout">
      <header
        style={{ background: "#007bff", color: "white", padding: "1rem" }}
      >
        <h3>ZentraQMS - Layout Simple</h3>
      </header>
      <main style={{ padding: "2rem" }}>{children}</main>
    </div>
  );
};

export default SimpleLayout;
