declare module 'pdfmake/interfaces' {
  export interface TDocumentDefinitions {
    content: any;
    styles?: any;
    defaultStyle?: any;
    pageSize?: any;
    pageOrientation?: any;
    pageMargins?: any;
    header?: any;
    footer?: any;
    background?: any;
    images?: any;
    [key: string]: any;
  }
}
