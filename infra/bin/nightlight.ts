// CDK app entry, run directly by Node 24 (type stripping; see cdk.json).
import {App, Tags} from 'aws-cdk-lib';
import {AWS_REGION} from '../../packages/shared/src/models.ts';
import {NightlightStack} from '../lib/nightlight-stack.ts';
import {stackName, stageName} from '../lib/stage.ts';

const app = new App();
const stage = stageName();

new NightlightStack(app, stackName(stage), {
  stage,
  env: {account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.AWS_REGION || AWS_REGION},
});
Tags.of(app).add('project', 'nightlight');
Tags.of(app).add('stage', stage);
