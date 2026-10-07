import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {CfnOutput, Duration, RemovalPolicy, Stack, type StackProps} from 'aws-cdk-lib';
import {HttpApi, HttpMethod, CorsHttpMethod} from 'aws-cdk-lib/aws-apigatewayv2';
import {HttpLambdaIntegration} from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import {Distribution, ViewerProtocolPolicy} from 'aws-cdk-lib/aws-cloudfront';
import {S3BucketOrigin} from 'aws-cdk-lib/aws-cloudfront-origins';
import {AttributeType, BillingMode, Table} from 'aws-cdk-lib/aws-dynamodb';
import {Architecture, Runtime} from 'aws-cdk-lib/aws-lambda';
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';
import {LogGroup, RetentionDays} from 'aws-cdk-lib/aws-logs';
import {BlockPublicAccess, Bucket, BucketEncryption} from 'aws-cdk-lib/aws-s3';
import type {Construct} from 'constructs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const handlerPath = (name: string) => path.join(repoRoot, 'services', 'api', 'src', `${name}.ts`);

export interface NightlightStackProps extends StackProps {
  stage: string;
}

/**
 * Nightlight backend (PLAN.md §4): HTTP API → Lambda, one DynamoDB table, and a private S3 bucket
 * served through CloudFront. Hackathon stacks are disposable, so data is destroyed with the stack.
 */
export class NightlightStack extends Stack {
  constructor(scope: Construct, id: string, props: NightlightStackProps) {
    super(scope, id, props);
    const {stage} = props;

    const table = new Table(this, 'Table', {
      partitionKey: {name: 'PK', type: AttributeType.STRING},
      sortKey: {name: 'SK', type: AttributeType.STRING},
      billingMode: BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const assets = new Bucket(this, 'Assets', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      // Privacy (PLAN.md §5): photos of children's drawings are deleted after a day.
      lifecycleRules: [{prefix: 'uploads/', expiration: Duration.days(1)}],
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const cdn = new Distribution(this, 'AssetsCdn', {
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(assets),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      comment: `Nightlight ${stage} story assets`,
    });

    const environment = {
      STAGE: stage,
      TABLE_NAME: table.tableName,
      ASSETS_BUCKET: assets.bucketName,
      ASSETS_DOMAIN: cdn.distributionDomainName,
    };
    const lambda = (name: string) => {
      const id = `${name[0].toUpperCase()}${name.slice(1)}Fn`;
      return new NodejsFunction(this, id, {
        entry: handlerPath(name),
        runtime: Runtime.NODEJS_24_X,
        architecture: Architecture.ARM_64,
        memorySize: 256,
        timeout: Duration.seconds(10),
        environment,
        logGroup: new LogGroup(this, `${id}Logs`, {retention: RetentionDays.ONE_WEEK, removalPolicy: RemovalPolicy.DESTROY}),
        depsLockFilePath: path.join(repoRoot, 'pnpm-lock.yaml'),
        projectRoot: repoRoot,
        bundling: {minify: true, sourceMap: false, target: 'node24'},
      });
    };

    const api = new HttpApi(this, 'Api', {
      apiName: `nightlight-${stage}`,
      corsPreflight: {allowOrigins: ['*'], allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.POST], allowHeaders: ['content-type', 'x-household-id']},
    });
    api.addRoutes({
      path: '/v1/health',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('HealthIntegration', lambda('health')),
    });

    new CfnOutput(this, 'ApiUrl', {value: `${api.apiEndpoint}/v1`});
    new CfnOutput(this, 'AssetsDomain', {value: cdn.distributionDomainName});
    new CfnOutput(this, 'AssetsBucket', {value: assets.bucketName});
    new CfnOutput(this, 'TableName', {value: table.tableName});
  }
}
