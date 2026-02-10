import "./globals.css";

export const metadata = {
  title: "Carrerra",
  description: "Your personalized AI-powered career guidance assistant",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
