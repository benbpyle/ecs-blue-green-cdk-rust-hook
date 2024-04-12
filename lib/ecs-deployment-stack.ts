import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import VpcConstruct from "./vpc-construct";
import {EcsClusterConstruct} from "./ecs-cluster-construct";
import {ClusterTaskDefinitionConstruct} from "./cluster-task-definition-construct";
import {EcsServiceConstruct} from "./ecs-service-construct";
import {ApplicationLoadBalancerConstruct} from "./application-load-balancer-construct";
import {ApiGatewayConstruct} from "./api-gateway-construct";
import { InstallTestFunctionConstruct } from './install-test-function-construct';

export class EcsDeploymentStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpcConstruct = new VpcConstruct(this, 'VpcConstruct');
        const ecsClusterConstruct = new EcsClusterConstruct(this, 'EcsClusterConstruct',
            {
                vpc: vpcConstruct.vpc
            });
        const loadBalancerConstruct = new ApplicationLoadBalancerConstruct(this, 'NetworkLoadBalancerConstruct',
            {
                vpc: vpcConstruct.vpc
            });
        const taskDefinitionConstruct = new ClusterTaskDefinitionConstruct(this, 'ClusterTaskDefinitionConstruct');
        const installFunctionConstruct = new InstallTestFunctionConstruct(this, 'InstallTestFunctionConstruct', {
            vpc: vpcConstruct.vpc,
            alb: loadBalancerConstruct.loadBalancer
        });

        const ecsServiceConstruct = new EcsServiceConstruct(this, 'EcsServiceConstruct',
            {
                vpc: vpcConstruct.vpc,
                cluster: ecsClusterConstruct.cluster,
                listener: loadBalancerConstruct.listener,
                greenTargetGroup: loadBalancerConstruct.greenTargetGroup,
                blueTargetGroup: loadBalancerConstruct.blueTargetGroup,
                task: taskDefinitionConstruct.taskDefinition,
                alb: loadBalancerConstruct.loadBalancer,
                securityGroup: loadBalancerConstruct.securityGroup,
                testListener: loadBalancerConstruct.testListener,
                testFunction: installFunctionConstruct.installFunction
            });
        const apiGatewayConstruct = new ApiGatewayConstruct(this, 'ApiGatewayConstruct', {
            alb: loadBalancerConstruct.loadBalancer,
            listener: loadBalancerConstruct.listener,
            vpc: vpcConstruct.vpc,
            securityGroup: loadBalancerConstruct.securityGroup
        });

    }
}
