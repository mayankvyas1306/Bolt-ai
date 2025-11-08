import "./globals.css";
import Provider from "./provider";
import ConvexClientProvider from "./ConvexClientProvider";

export const metadata = {
  title: "Bolt AI",
  description: "Transform Idea into code",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ConvexClientProvider>
          <ErrorBoundary>
            <Provider>{children}</Provider>
+          </ErrorBoundary>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
