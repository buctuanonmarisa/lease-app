import "./globals.css";

export const metadata = {
  title: "LeaseFlow — AI Tenant Screening",
  description: "AI-powered tenant screening. Apply, upload documents, and track your application in minutes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
