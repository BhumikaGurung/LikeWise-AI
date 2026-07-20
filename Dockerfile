FROM node:22

ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

RUN corepack enable

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile=false

RUN export VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY && pnpm --filter @workspace/learnwise-ai build
RUN pnpm --filter @workspace/api-server build

EXPOSE 8080

CMD ["pnpm","--filter","@workspace/api-server","start"]