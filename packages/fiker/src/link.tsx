import React, { useEffect } from "react";
// import { useRouter } from "./router";

interface LinkProps
  extends Omit<React.HtmlHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
  children: React.ReactNode;
}

export const routeChanged = new CustomEvent("routeChanged");
export const updatePageEvent = new CustomEvent("updatePage");

const Link: React.FC<LinkProps> = ({ to, children, ...props }) => {
  // const router = useRouter();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    // router.push(to);
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
