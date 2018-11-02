FROM node as builder
WORKDIR /usr/app
COPY package*.json ./ 
RUN npm install
COPY . .
RUN npm run build

FROM node
WORKDIR /usr/app
COPY package*.json ./
RUN npm install
COPY --from=builder /usr/app/build ./build
COPY .env .

EXPOSE 9000
CMD NODE_ENV=production node build/server.js