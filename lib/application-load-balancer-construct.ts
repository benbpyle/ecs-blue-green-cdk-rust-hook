import {Construct} from "constructs";
import {
    ApplicationListener,
    ApplicationLoadBalancer, ApplicationTargetGroup,
    IApplicationListener,
    ITargetGroup,
    Protocol,
    TargetType
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import {Port, SecurityGroup, Vpc} from "aws-cdk-lib/aws-ec2";
import {CfnOutput, Duration} from "aws-cdk-lib";

export interface ApplicationLoadBalancerConstructProps {
    vpc: Vpc
}

export class ApplicationLoadBalancerConstruct extends Construct {
    private readonly _loadBalancer: ApplicationLoadBalancer;
    private readonly _greenTargetGroup: ApplicationTargetGroup;
    private readonly _blueTargetGroup: ApplicationTargetGroup;
    private readonly _listener: ApplicationListener;
    private readonly _testListener: ApplicationListener;
    private readonly _securityGroup: SecurityGroup;

    get testListener(): ApplicationListener {
        return this._testListener;
    }

    get loadBalancer(): ApplicationLoadBalancer {
        return this._loadBalancer;
    }

    get greenTargetGroup(): ITargetGroup {
        return this._greenTargetGroup;
    }

    get blueTargetGroup(): ITargetGroup {
        return this._blueTargetGroup;
    }

    get listener(): IApplicationListener {
        return this._listener;
    }

    get securityGroup(): SecurityGroup {
        return this._securityGroup;
    }

    constructor(scope: Construct, id: string, props: ApplicationLoadBalancerConstructProps) {
        super(scope, id);


        this._securityGroup = new SecurityGroup(scope, 'SecurityGroup', {
            vpc: props.vpc,
            allowAllOutbound: true
        })

        this._securityGroup.addIngressRule(this.securityGroup, Port.tcp(3000), 'Group Inbound', false);

        this._loadBalancer = new ApplicationLoadBalancer(scope, 'NetworkLoadBalancer', {
            vpc: props.vpc,
            loadBalancerName: 'sample-cluster-nlb',
            vpcSubnets: {
                subnets: props.vpc.privateSubnets,
                onePerAz: true,
                availabilityZones: props.vpc.availabilityZones
            },
            securityGroup: this.securityGroup
        });

        this._blueTargetGroup = new ApplicationTargetGroup(this, 'blueGroup', {
            vpc: props.vpc,
            port: 80,
             targetGroupName: "sample-cluster-blue",
            targetType: TargetType.IP,
            healthCheck: {
                protocol: Protocol.HTTP,
                path: '/health',
                timeout: Duration.seconds(30),
                interval: Duration.seconds(60),
                healthyHttpCodes: '200'
            }
        });

        this._greenTargetGroup = new ApplicationTargetGroup(this, 'greenGroup', {
            vpc: props.vpc,
            port: 80,
            targetType: TargetType.IP,
            targetGroupName: "sample-cluster-green",
            healthCheck: {
                protocol: Protocol.HTTP,
                path: '/health',
                timeout: Duration.seconds(30),
                interval: Duration.seconds(60),
                healthyHttpCodes: '200'
            }
        });

        this._listener = this._loadBalancer.addListener('albProdListener', {
            port: 80,
            defaultTargetGroups: [this._blueTargetGroup]
        });

        this._testListener = this._loadBalancer.addListener('albTestListener', {
            port: 8080,
            defaultTargetGroups: [this._greenTargetGroup]
        });

        new CfnOutput(scope, 'LoadBalancerArn', {
            exportName: 'sample-cluster-nlb-arn',
            value: this._loadBalancer.loadBalancerArn
        });
    }
}