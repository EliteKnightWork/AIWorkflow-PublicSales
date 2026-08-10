#!/bin/bash

set -eu

export AWS_DEFAULT_PROFILE=labid

function _usage() {
  echo "Usage: $(basename $0) [-e ENV]"
  echo "  -e  ENV       deploy env (dev | prod)"
  echo "  -h            print this help"
  exit 255
}

while getopts e:h OPT; do
  case $OPT in
  'e') ENV=$OPTARG ;;
  'h') _usage ;;
  *) _usage ;;
  esac
done

if [ "${ENV}" = "dev" ]; then
  echo "=== Port Forwarding to RDS Dev ==="
  RDS_HOST=labid-database-cluster-dev.cluster-c7giuhdn2om1.ap-northeast-1.rds.amazonaws.com
elif [ "${ENV}" = "prod" ]; then
  echo "=== Port Forwarding to RDS Prod ==="
  RDS_HOST=labid-database-cluster-prod.cluster-c7giuhdn2om1.ap-northeast-1.rds.amazonaws.com
else
  echo "Invalid ENV: ${ENV}"
  exit 1
fi

ECS_CLUSTER_NAME=labid-app-cluster-${ENV}
ECS_SERVICE_NAME=labid-server-service-${ENV}
ECS_CONTAINER_NAME=labid-server-${ENV}

TASK_ID=$(aws ecs list-tasks \
  --cluster ${ECS_CLUSTER_NAME} \
  --service ${ECS_SERVICE_NAME} |
  jq -r '.taskArns[0]' |
  awk -F '/' '{print $3}')

RUNTIME_ID=$(
  aws ecs describe-tasks \
    --cluster ${ECS_CLUSTER_NAME} \
    --task ${TASK_ID} |
    jq .tasks[].containers[].runtimeId |
    jq -s '.[] | select(. != null) | .' |
    sed 's/"//g'
)

TARGET=ecs:${ECS_CLUSTER_NAME}_${TASK_ID}_${RUNTIME_ID}
LOCAL_PORT_NUMBER=3309
PORT_NUMBER=3306

aws ssm start-session \
  --target ${TARGET} \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"host":["'${RDS_HOST}'"], "localPortNumber":["'${LOCAL_PORT_NUMBER}'"], "portNumber":["'${PORT_NUMBER}'"]}'
