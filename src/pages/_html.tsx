import React from "react"

type HtmlProps = {
  htmlAttributes: React.ComponentProps<"html">
  headAttributes: React.ComponentProps<"head">
  bodyAttributes: React.ComponentProps<"body">
  head: React.ReactNode
  preBodyTags: React.ReactNode
  body: React.ReactNode
  postBodyTags: React.ReactNode
}

export default function Html({
  htmlAttributes,
  headAttributes,
  bodyAttributes,
  head,
  preBodyTags,
  body,
  postBodyTags,
}: HtmlProps): JSX.Element {
  return (
    <html {...htmlAttributes}>
      <head {...headAttributes}>
        {head}
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto&display=swap"
          rel="stylesheet"
        />
      </head>
      <body {...bodyAttributes}>
        {preBodyTags}
        {body}
        {postBodyTags}
      </body>
    </html>
  )
}
