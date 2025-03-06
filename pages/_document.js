
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </Head>
      <Body>
        <Main />
        <NextScript />
      </Body>
    </Html>
  )
}

function Body({ children }) {
  return (
    <body>
      {children}
    </body>
  )
}
