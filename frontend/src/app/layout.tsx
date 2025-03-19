import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { APP_NAME } from '@/config'
import GoogleAnalytics from '@/components/GoogleAnalytics'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: `${APP_NAME} - Focus on What Truly Matters`,
  description: `${APP_NAME} is a focused productivity system that ensures you only work on 6 core projects that truly matter, helping you regain control of your time and energy.`,
  keywords: 'productivity, focus, time management, task management, project management, sacred six, 6 projects, daily tasks',
  authors: [{ name: APP_NAME }],
  creator: APP_NAME,
  publisher: APP_NAME,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.sacred6.com',
    title: `${APP_NAME} - Focus on What Truly Matters`,
    description: `${APP_NAME} is a focused productivity system that ensures you only work on 6 core projects that truly matter, helping you regain control of your time and energy.`,
    siteName: APP_NAME,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} - Focus on What Truly Matters`,
    description: `${APP_NAME} is a focused productivity system that ensures you only work on 6 core projects that truly matter, helping you regain control of your time and energy.`,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="canonical" href="https://www.sacred6.com" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <GoogleAnalytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
