#!/bin/bash

set -eu

export AWS_DEFAULT_PROFILE=labid

function _usage() {
  echo "Usage: $(basename $0) [-e ENV]"
  echo "  -e  ENV       deploy env (dev | prod)"
  echo "  -c  CONTAINER container name (server | client)"
  echo "  -h            print this help"
  exit 255
}

while getopts e:c:h OPT; do
  case $OPT in
  'e') ENV=$OPTARG ;;
  'c') CONTAINER=$OPTARG ;;
  'h') _usage ;;
  *) _usage ;;
  esac
done

ECS_CLUSTER_NAME=labid-app-cluster-${ENV}
ECS_SERVICE_NAME=labid-${CONTAINER}-service-${ENV}
ECS_CONTAINER_NAME=labid-${CONTAINER}-${ENV}

TASK_ID=$(aws ecs list-tasks \
  --cluster ${ECS_CLUSTER_NAME} \
  --service ${ECS_SERVICE_NAME} |
  jq -r '.taskArns[0]' |
  awk -F '/' '{print $3}')

aws ecs execute-command \
  --task=${TASK_ID} \
  --cluster=${ECS_CLUSTER_NAME} \
  --container=${ECS_CONTAINER_NAME} \
  --interactive \
  --command /bin/bash
