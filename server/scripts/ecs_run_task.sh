#!/bin/bash

set -eu

export AWS_DEFAULT_PROFILE=labid

COMMAND=""

function _usage() {
  echo "Usage: $(basename $0) [-e ENV] [-c COMMAND] [-h]"
  echo "  -e  ENV       deploy env (dev | prod)"
  echo "  -c  COMMAND  command to run"
  echo "  -h            print this help"
  exit 1
}

while getopts e:c:h OPT; do
  case $OPT in
  'e') ENV=$OPTARG ;;
  'c') COMMAND=$OPTARG ;;
  'h') _usage ;;
  *) _usage ;;
  esac
done

if [ "$COMMAND" == "" ]; then
  echo "[ERROR] Please enter command"
  _usage
fi

ECS_CLUSTER_NAME=labid-app-cluster-${ENV}
ECS_SERVICE_NAME=labid-server-service-${ENV}
ECS_CONTAINER_NAME=labid-server-${ENV}
ECS_TASK_NAME=labid-server-${ENV}
CWL=/ecs/logs/${ENV}/labid-server-${ENV}
CWL_STREAM_PREFIX=labid-server-${ENV}/labid-server-${ENV}

NETWORK_CONFIGURATION=$(aws ecs describe-services \
  --cluster ${ECS_CLUSTER_NAME} \
  --services ${ECS_SERVICE_NAME} |
  jq -r '.services[] | .networkConfiguration')

RUN_TASK_ARN=$(aws ecs run-task \
  --count 1 \
  --launch-type FARGATE \
  --network-configuration "${NETWORK_CONFIGURATION}" \
  --cluster ${ECS_CLUSTER_NAME} \
  --task-definition ${ECS_TASK_NAME} \
  --overrides "{\"containerOverrides\": [{\"name\": \"${ECS_CONTAINER_NAME}\",\"command\":[\"sh\",\"-c\", \"${COMMAND}\"]}]}" |
  jq -r ".tasks[0].taskArn")

echo "run task arn: ${RUN_TASK_ARN}"

TASK_ID=$(echo $RUN_TASK_ARN | cut -d "/" -f 3)
CWL_STREAM="${CWL_STREAM_PREFIX}/${TASK_ID}"

echo "[$ENV] start run task. ${COMMAND}"
echo "Please execute the following command to view the log."
echo "---"
echo "aws logs tail ${CWL} --log-stream-name-prefix ${CWL_STREAM} --follow --format short --profile labid"
echo "---"
echo ""
echo "To stop task, execute the following command."
echo "---"
echo "aws ecs stop-task --cluster ${ECS_CLUSTER_NAME} --task ${RUN_TASK_ARN} --profile labid"
echo "---"

echo "waiting for task complete ..."
aws ecs wait tasks-stopped --cluster ${ECS_CLUSTER_NAME} --tasks "${RUN_TASK_ARN}"

echo "task complete"
