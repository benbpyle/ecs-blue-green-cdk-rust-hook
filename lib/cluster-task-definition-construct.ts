import {Construct} from "constructs";
import {
    AppProtocol,
    Compatibility,
    ContainerImage,
    CpuArchitecture,
    LogDrivers,
    NetworkMode,
    OperatingSystemFamily,
    Protocol,
    TaskDefinition
} from "aws-cdk-lib/aws-ecs";
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {Repository} from "aws-cdk-lib/aws-ecr";

export class ClusterTaskDefinitionConstruct extends Construct {
    private readonly _taskDefinition: TaskDefinition;
    get taskDefinition(): TaskDefinition {
        return this._taskDefinition;
    }

    constructor(scope: Construct, id: string) {
        super(scope, id);
        const executionPolicy = new PolicyStatement({
            actions: [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            resources: ["*"],
            effect: Effect.ALLOW
        });


        this._taskDefinition = new TaskDefinition(scope, 'rust-blue-green', {
            cpu: "256",
            memoryMiB: "512",
            compatibility: Compatibility.FARGATE,
            runtimePlatform: {
                cpuArchitecture: CpuArchitecture.ARM64,
                operatingSystemFamily: OperatingSystemFamily.LINUX
            },
            networkMode: NetworkMode.AWS_VPC,
            family: "rust-blue-green"
        });

        this._taskDefinition.addToExecutionRolePolicy(executionPolicy);

        const repository = Repository.fromRepositoryArn(scope, 'EcrRepository', 'arn:aws:ecr:<region>:<account>:repository/ecs-blue-green');
        const container = this._taskDefinition.addContainer("rust-api", {
            // Use an image from Amazon ECR
            image: ContainerImage.fromEcrRepository(repository, 'print-green'),
            logging: LogDrivers.awsLogs({streamPrefix: 'rust-api'}),
            environment: {
            },
            containerName: 'rust-api',
            essential: true,
            cpu: 256,
            memoryReservationMiB: 512
            // ... other options here ...
        });

        container.addPortMappings({
            containerPort: 3000,
            appProtocol: AppProtocol.http,
            name: "web",
            protocol: Protocol.TCP
        });


    }
}