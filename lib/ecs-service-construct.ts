import {ISecurityGroup, SecurityGroup, Vpc} from "aws-cdk-lib/aws-ec2";
import {Cluster, DeploymentControllerType, FargateService, TaskDefinition} from "aws-cdk-lib/aws-ecs";
import {Construct} from "constructs";
import {
    ApplicationLoadBalancer,
    IListener,
    ITargetGroup,
    NetworkTargetGroup
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import {EcsDeploymentConfig, EcsDeploymentGroup} from "aws-cdk-lib/aws-codedeploy";
import {IFunction} from "aws-cdk-lib/aws-lambda";

export interface EcsServiceConstructProps {
    vpc: Vpc,
    cluster: Cluster,
    alb: ApplicationLoadBalancer,
    task: TaskDefinition,
    listener: IListener,
    testListener: IListener,
    blueTargetGroup: ITargetGroup,
    greenTargetGroup: ITargetGroup,
    securityGroup: ISecurityGroup,
    testFunction: IFunction
}

export class EcsServiceConstruct extends Construct {
    constructor(scope: Construct, id: string, props: EcsServiceConstructProps) {
        super(scope, id);

        const service = new FargateService(this, 'Service', {
            cluster: props.cluster,
            taskDefinition: props.task,
            desiredCount: 1,
            deploymentController: {
                type: DeploymentControllerType.CODE_DEPLOY,
            },
            securityGroups: [props.securityGroup]
        });

        service.attachToNetworkTargetGroup(props.blueTargetGroup as NetworkTargetGroup);
        new EcsDeploymentGroup(this, 'BlueGreenDG', {
            service,
            blueGreenDeploymentConfig: {
                blueTargetGroup: props.blueTargetGroup,
                greenTargetGroup: props.greenTargetGroup,
                listener: props.listener,
                testListener: props.testListener,

            },

            deploymentConfig: EcsDeploymentConfig.ALL_AT_ONCE,
        });
    }
}