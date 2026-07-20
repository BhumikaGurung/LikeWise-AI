FROM node:22

RUN corepack enable

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile=false

RUN pnpm --filter @workspace/learnwise-ai build
RUN pnpm --filter @workspace/api-server build

EXPOSE 8080

CMD ["pnpm","--filter","@workspace/api-server","start"]