# ===== BUILD STAGE =====
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# set base path cho Vite khi build
ARG VITE_APP_BASE_NAME=/react/login/
ENV VITE_APP_BASE_NAME=$VITE_APP_BASE_NAME

RUN npm run build

# ===== RUN STAGE =====
FROM nginx:alpine

# nginx config (SPA + base path)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# copy build output vào đúng folder base
RUN mkdir -p /usr/share/nginx/html/react/login
COPY --from=build /app/dist /usr/share/nginx/html/react/login

EXPOSE 80
CMD ["nginx","-g","daemon off;"]
