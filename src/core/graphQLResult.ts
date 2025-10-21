import {
  anyOf,
  array,
  dict,
  nullable,
  number,
  object,
  optional,
  Schema,
  string,
  unknown
} from '@apimatic/schema';

export type GraphQLError = {
  message: string;
  locations?: { line: number; column: number }[];
  path?: Array<string | number>;
  extensions?: Record<string, any>;
};

export type GraphQLResult<T> = {
  data?: T | null;
  errors?: GraphQLError[];
  extensions?: Record<string, any>;
};

const graphQLErrorSchema: Schema<GraphQLError> = object({
  message: ['message', string()],
  locations: ['locations', optional(array(object({
  	line: ['line', number()],
    column: ['column', number()],
  })))],
  path: ['path', optional(array(anyOf([string(), number()])))],
  extensions: ['extensions', optional(dict(unknown()))],
});

export const graphQLResultSchema: Schema<GraphQLResult<any>> = object({
  data: ['data', optional(nullable(unknown()))],
  errors: ['errors', optional(array(graphQLErrorSchema))],
  extensions: ['extensions', optional(dict(unknown()))],
});
