# syntax=docker/dockerfile:1.5

FROM node:20-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]

