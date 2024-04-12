import {Construct} from "constructs";
import {HttpApi, HttpMethod, VpcLink} from "aws-cdk-lib/aws-apigatewayv2";
import {ApplicationLoadBalancer, IApplicationListener} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import {ISecurityGroup, Vpc} from "aws-cdk-lib/aws-ec2";
import {HttpAlbIntegration} from "aws-cdk-lib/aws-apigatewayv2-integrations";

export interface ApiGatewayConstructProps {
    alb: ApplicationLoadBalancer;
    listener: IApplicationListener;
    securityGroup: ISecurityGroup;
    vpc: Vpc;
}

export class ApiGatewayConstruct extends Construct {
    constructor(scope: Construct, id: string, props: ApiGatewayConstructProps) {
        super(scope, id);

        const link = new VpcLink(scope, 'VpcLink', {
            vpc: props.vpc,
            vpcLinkName: 'sample-cluster-vpc-link',
            securityGroups: [props.securityGroup],

        })

        const albIntegration = new HttpAlbIntegration('ALBIntegration', props.listener, {
            vpcLink: link
        });

        const apiGateway = new HttpApi(scope, 'SampleClusterAPI', {});
        apiGateway.addRoutes({
            path: "/one",
            methods: [HttpMethod.GET],
            integration: albIntegration
        })

    }
}