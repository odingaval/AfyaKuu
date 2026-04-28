declare module 'express-validator' {
  export function validationResult(req: any): any;
  export function body(field: string, message?: string): any;
  export function checkSchema(schema: any): any;
}