import {Construct} from "constructs";
import {RustFunction} from "cargo-lambda-cdk";
import {Architecture, IFunction} from "aws-cdk-lib/aws-lambda";
import {SecurityGroup, Vpc} from "aws-cdk-lib/aws-ec2";
import {ApplicationLoadBalancer} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {CfnOutput} from "aws-cdk-lib";

export interface InstallTestFunctionConstructProps {
    vpc: Vpc,
    alb: ApplicationLoadBalancer
}
export class InstallTestFunctionConstruct extends Construct {
    private readonly _function: RustFunction;
    get installFunction(): IFunction {
        return this._function;
    }
    constructor(scope: Construct, id: string, props: InstallTestFunctionConstructProps) {
        super(scope, id);

        const securityGroup = new SecurityGroup(scope, 'FunctionSecurityGroup', {
           allowAllOutbound: true,
            vpc: props.vpc,
        });

        this._function = new RustFunction(scope, "InstallTestFunction", {
            manifestPath: './',
            architecture: Architecture.ARM_64,
            memorySize: 256,
            vpc: props.vpc,
            securityGroups: [securityGroup],
            vpcSubnets: {
                subnets: props.vpc.privateSubnets
            },
            environment: {
                ALB_URL: props.alb.loadBalancerDnsName
            }
        });

        this._function.addToRolePolicy(new PolicyStatement({
            actions: [
                "codedeploy:PutLifecycleEventHookExecutionStatus"
            ],
            resources: ["*"],
            effect: Effect.ALLOW,
            sid: "CodeDeployActions"
        }))

        new CfnOutput(scope, 'LambdaInstallFunctionName', {
            value: this._function.functionName,
            exportName: 'LambdaInstallFunctionName'
        })

        new CfnOutput(scope, 'LambdaInstallFunctionArn', {
            value: this._function.functionArn,
            exportName: 'LambdaInstallFunctionArn'
        })

    }
}