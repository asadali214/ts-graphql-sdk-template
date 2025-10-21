import { GraphQLClient, QueryType, GraphQLResult } from './core/index.js';
<$rootSchemaImports>
<$responsesImports>
<$inputsImports>
<$queriesImports>

export class Client {
  private client: GraphQLClient;

  constructor() {
    this.client = new GraphQLClient(<$clientConfig>);
  }

  <$clientMethods>
}
