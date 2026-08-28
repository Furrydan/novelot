import type { ReactNode } from "react";
import "./Page.css";
import TopBar from "./TopBar";

interface PageProps {
  children: ReactNode;
}

function Page({ children }: PageProps) {
  return (
    <div className="page">
      <TopBar />
      <main className="page-content">{children}</main>
    </div>
  );
}

export default Page;
