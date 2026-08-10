FROM --platform=linux/x86_64 node:22.21.1-slim
WORKDIR /usr/app
COPY ./ /usr/app
RUN apt-get update && apt-get install -y ca-certificates
RUN yarn cache clean --force
RUN yarn install
RUN yarn run build
EXPOSE 8080

CMD ["yarn", "run", "start", "-p", "8080"]
