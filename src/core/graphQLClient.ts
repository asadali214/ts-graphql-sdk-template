import { AbortError, GraphQLClientConfig, GraphQLResult } from './index.js';
import { HttpClient } from '@apimatic/axios-client-adapter';
import { HttpRequest } from '@apimatic/core-interfaces';
import { nullable, optional, Schema, validateAndMap } from '@apimatic/schema';
import { graphQLResultSchema } from './graphQLResult.js';

export enum QueryType {
  Query = 'query',
  Mutation = 'mutation'
}

export class GraphQLClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private httpClient: HttpClient;

  constructor(config: GraphQLClientConfig) {
    this.baseUrl = config.baseUrl;
    this.headers = config.headers ?? {};
    this.httpClient = new HttpClient(AbortError, { timeout: config.timeout });
  }

  async execute<T>(
    operationName: string,
    operationType: QueryType,
    queryObj: Record<string, any>,
    schema: Schema<T>,
    variables?: Record<string, any>,
    types?: Record<string, string>,
  ): Promise<GraphQLResult<T>> {
    const query = this.buildQuery(
      operationType,
      types ?? {},
      operationName,
      variables ? Object.keys(variables) : [],
      this.buildFields(queryObj)
    );
    const request: HttpRequest = {
      method: 'POST',
      url: this.baseUrl,
      headers: { ...this.headers, 'Content-Type': 'application/json' },
      body: {
        type: 'text',
        content: JSON.stringify({ query, variables })
      }
    };
    const response = await this.httpClient.executeRequest(request);

    if (typeof response.body !== 'string') {
      return {
        data: null,
        errors: [
          {
            message: `Invalid response body format from ${this.baseUrl}`
          }
        ]
      };
    }
    const parsedBody = JSON.parse(response.body);
    const validationResult = validateAndMap(parsedBody, graphQLResultSchema);
    const validationResultData = validateAndMap(parsedBody.data?.[operationName], optional(nullable(schema)));
    if (validationResult.errors) {
      return {
        data: null,
        errors: [
          ...validationResult.errors.map(err => ({
            message: err.message ?? 'Unknown error',
          }))
        ]
      };
    }
    if (validationResultData.errors) {
      return {
        data: null,
        errors: [
          ...validationResultData.errors.map(err => ({
            message: err.message ?? 'Unknown error',
          }))
        ]
      };
    }
    return {
      ...validationResult.result,
      data: validationResultData.result
    };
  }

  private buildQuery(
    operation: QueryType,
    types: Record<string, string>,
    operationName: string,
    variables: string[],
    fields: string,
    ): string {
    const varNames = variables.length > 0 ?
        `(${variables.map(v => `${v}: $${v}`).join(', ')})` : '';
    const filteredTypes = Object.keys(types).filter(t => variables.includes(t));
    const typeDefs = filteredTypes.length > 0 ?
        `(${filteredTypes.map(t => `$${t}: ${types[t]}`).join(', ')})` : '';

    return `${operation}${typeDefs} { ${operationName}${varNames}${fields} }`;
  }

  private buildFields(obj: Record<string, any>): string {
    const fields: string[] = Object.entries(obj)
      .filter(([_, v]) => v)
      .map(([k, v]) => {
        if (typeof v === 'object') {
          return k + this.buildFields(v);
        }
        return k;
      });

    if (fields.length === 0) {
      return '';
    }

    return ` {${fields.join(' ')}}`;
  }
}
