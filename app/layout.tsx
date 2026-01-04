import "./globals.css";

export const metadata = {
  title: "Virtual Data Room",
  description: "Prototype UI for a virtual data room experience.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
