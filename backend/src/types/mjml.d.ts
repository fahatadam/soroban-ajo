declare module 'mjml' {
  interface MjmlOptions {
    fonts?: Record<string, string>
    keepComments?: boolean
    beautify?: boolean
    minify?: boolean
    validationLevel?: 'strict' | 'soft' | 'skip'
    filePath?: string
  }

  interface MjmlOutput {
    html: string
    errors: Array<{ line: number; message: string; tagName: string; formattedMessage: string }>
  }

  function mjml2html(input: string, options?: MjmlOptions): MjmlOutput
  export = mjml2html
}
