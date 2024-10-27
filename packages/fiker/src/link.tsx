import React, { useEffect } from "react";

interface LinkProps
  extends Omit<React.HtmlHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
  children: React.ReactNode;
}

const routeChanged = new CustomEvent("routeChanged");

const Link: React.FC<LinkProps> = ({ to, children, ...props }) => {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    window.history.pushState({}, "", to);
    window.dispatchEvent(routeChanged);
  };

  return (
    <a
      {...props}
      href={to}
      onClick={handleClick}
      style={{ textDecoration: "underline", color: "blue", ...props.style }}
    >
      {children}
    </a>
  );
};

export default Link;
