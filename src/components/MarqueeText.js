import React from "react";

export default function MarqueeText({ text = "", className = "" }) {
  if (!text) return null;
  return <div className={className}>{text}</div>;
}
