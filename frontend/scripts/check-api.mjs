import SwaggerParser from '@apidevtools/swagger-parser';

const contract = await SwaggerParser.validate('docs/openapi.yaml');
const operations = Object.values(contract.paths).flatMap(path => Object.keys(path).filter(key => ['get', 'post', 'patch', 'delete'].includes(key)));
console.log(`OpenAPI ${contract.info.version}: ${operations.length} operations validated.`);
