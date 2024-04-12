import {Vpc} from "aws-cdk-lib/aws-ec2";
import {Construct} from "constructs";
import {Cluster} from "aws-cdk-lib/aws-ecs";

export interface EcsClusterProps {
    vpc: Vpc
}

export class EcsClusterConstruct extends Construct{
    private readonly _cluster: Cluster;

    get cluster(): Cluster {
        return this._cluster;
    }

    constructor(scope: Construct, id: string, props: EcsClusterProps) {
        super(scope, id);

        this._cluster = new Cluster(scope, 'EcsCluster', {
            clusterName: 'sample-cluster',
            vpc: props.vpc
        })
    }
}