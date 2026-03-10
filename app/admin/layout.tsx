import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "한평생교육 어드민 관리자 페이지",
  description: "한평생교육 어드민 관리자 페이지",
  openGraph: {
    title: "한평생교육 어드민 관리자 페이지",
    description: "한평생교육 어드민 관리자 페이지",
    images: [
      {
        url: "/og-image-admin.png",
        width: 1200,
        height: 630,
        alt: "한평생교육 어드민 관리자 페이지",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "한평생교육 어드민 관리자 페이지",
    description: "한평생교육 어드민 관리자 페이지",
    images: ["/og-image-admin.png"],
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
